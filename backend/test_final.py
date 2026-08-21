import io, sys
sys.stdout.reconfigure(encoding="utf-8")
import pymupdf
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)
passed = 0
failed = 0

def assert_eq(a, b, msg=""):
    assert a == b, f"{msg}: {a!r} != {b!r}"

def assert_true(v, msg=""):
    assert v, f"{msg}: expected truthy, got {v!r}"

def run(name, fn):
    global passed, failed
    try:
        fn(); passed += 1; print(f"  PASS  {name}")
    except Exception as e:
        failed += 1; print(f"  FAIL  {name}: {e}")

def make_pdf(text):
    doc = pymupdf.open()
    p = doc.new_page(width=595, height=842)
    p.insert_text((50, 80), text, fontsize=12, fontname="helv")
    d = doc.tobytes()
    doc.close()
    return d

def upload(data, name, ct="application/pdf"):
    return client.post("/api/upload", files={"file": (name, io.BytesIO(data), ct)})

print("\n=== HEALTH ===")
run("Health", lambda: assert_eq(client.get("/api/health").json()["status"], "ok"))
run("Tesseract", lambda: assert_true("available" in client.get("/api/tesseract").json()))

print("\n=== EXTRACTION ===")
def t_pdf():
    r = upload(make_pdf("Hello world test content for extraction"), "t.pdf")
    assert_eq(r.json()["success"], True)
    assert_true(r.json()["analysis"] is not None)
    assert_true(r.json()["download_id"] is not None)
run("Text PDF + analysis + download_id", t_pdf)

def t_multipage():
    r = upload(make_pdf("Page one content here with enough words."), "m.pdf")
    assert_eq(r.json()["success"], True)
    assert_true(r.json()["page_count"] >= 1)
run("Multi-page PDF", t_multipage)

print("\n=== SUITABILITY ===")
def t_social():
    txt = (
        "Did you know? Stop scrolling!\n\n"
        "Here are our tips:\n- Post daily\n- Engage\n\n"
        "Which tip? Comment below!\n\nFollow us. Link in bio!\n\n"
        "#SocialMedia #Marketing #Tips"
    )
    r = upload(make_pdf(txt), "sm.pdf")
    a = r.json()["analysis"]
    assert_eq(a["suitability"]["label"], "likely_social_media")
    assert_true(a["engagement_score"] >= 50)
    assert_true(len(a["strengths"]) > 0)
    assert_true(len(a["score_explanations"]) == 9)
run("Social media -> likely_social_media", t_social)

def t_doc():
    txt = (
        "Abstract\nThis paper analyzes distributed systems.\n"
        "Introduction\nThe challenges of scalability remain.\n"
        "Conclusion\nWe demonstrated improvements.\n"
        "[1] Lamport 1978\n[2] Tanenbaum 2017"
    )
    r = upload(make_pdf(txt), "doc.pdf")
    a = r.json()["analysis"]
    assert_eq(a["suitability"]["label"], "likely_document")
    assert_true(len(a["suitability"]["reasons"]) >= 1)
    assert_true(len(a["improvements"]) > 0)
run("Technical document -> likely_document", t_doc)

def t_possibly():
    txt = "Great content about gardening. Plants are beautiful and nature is wonderful."
    r = upload(make_pdf(txt), "mid.pdf")
    label = r.json()["analysis"]["suitability"]["label"]
    assert_true(label in ("possibly_social_media", "likely_social_media"))
run("Mixed content -> possibly_social_media", t_possibly)

print("\n=== EXTENDED SUITABILITY SCENARIOS ===")
def t_ext_social():
    txt = "Did you know? Stop scrolling!\nCheck out our latest tips below:\n- Tip 1: Engagement\n- Tip 2: Quality\nWhich tip is your favorite? Comment below!\nLink in bio for more! #SocialMedia #Tips #Growth"
    r = upload(make_pdf(txt), "sm_ext.pdf")
    a = r.json()["analysis"]
    assert_eq(a["content_type"], "social_media")
    assert_eq(a["suitability"]["suitability"], "likely_social_media")
    assert_eq(a["score_applicability"], "high")
    assert_true(a["suitability_confidence"] >= 70)
    assert_true("Hashtags detected" in a["classification_reasons"])
    assert_true("Call to action detected" in a["classification_reasons"])
run("1. Genuine social media content", t_ext_social)

def t_ext_report():
    txt = (
        "Executive Summary\nThis project report details the overall status and deliverables of Q3.\n\n"
        "Overview\nThe system architecture was refactored for higher performance and deployment efficiency.\n\n"
        "Key Findings\n- Architecture scalability improved by 40%\n- Database latency reduced\n\n"
        "Recommendations\nProceed with full API rollout.\n\n"
        "Deliverables\n- Final backend repository\n- System documentation and pipeline"
    )
    r = upload(make_pdf(txt), "report_ext.pdf")
    a = r.json()["analysis"]
    assert_eq(a["content_type"], "report")
    assert_eq(a["suitability"]["suitability"], "likely_document")
    assert_eq(a["score_applicability"], "low")
    assert_true(a["suitability_confidence"] >= 80)
    assert_true("Multiple section headings detected" in a["classification_reasons"] or "Report section headings detected" in a["classification_reasons"])
run("2. Technical/project report", t_ext_report)

def t_ext_academic():
    txt = (
        "Abstract\nThis paper evaluates neural network optimization strategies.\n\n"
        "Introduction\nRecent advances in machine learning rely on deep architectures.\n\n"
        "Methodology\nWe conducted experiments across multiple benchmark datasets.\n\n"
        "Results\nAccuracy increased by 5.4%.\n\n"
        "Discussion\nThese findings suggest significant computational efficiency.\n\n"
        "Conclusion\nOur method outperforms existing baselines.\n\n"
        "References\n[1] Vaswani et al., 2017\n[2] Devlin et al., 2019"
    )
    r = upload(make_pdf(txt), "academic_ext.pdf")
    a = r.json()["analysis"]
    assert_eq(a["content_type"], "academic_document")
    assert_eq(a["suitability"]["suitability"], "likely_document")
    assert_eq(a["score_applicability"], "low")
    assert_true(a["suitability_confidence"] >= 80)
    assert_true("Academic section headings detected" in a["classification_reasons"])
    assert_true("Reference/citation patterns detected" in a["classification_reasons"])
run("3. Academic-style document", t_ext_academic)

def t_ext_ambiguous():
    txt = "Gardening tips and tricks for spring. The flowers are blooming nicely in the garden."
    r = upload(make_pdf(txt), "ambiguous_ext.pdf")
    a = r.json()["analysis"]
    assert_eq(a["content_type"], "unknown")
    assert_eq(a["score_applicability"], "medium")
    assert_true(a["suitability_confidence"] > 0)
    assert_true(len(a["classification_reasons"]) > 0)
run("4. Ambiguous/mixed content", t_ext_ambiguous)

def t_ext_empty():
    from services.content_analyzer import analyze_content
    a = analyze_content("")
    assert_eq(a["content_type"], "unknown")
    assert_eq(a["suitability"]["suitability"], "unknown")
    assert_eq(a["suitability_confidence"], 0)
    assert_eq(a["score_applicability"], "low")
    assert_true(len(a["score_applicability_reason"]) > 0)
    assert_eq(a["classification_reasons"], ["No text content detected"])
run("5. Empty content", t_ext_empty)


print("\n=== SCORE EXPLANATIONS ===")
def t_no_hashtags():
    r = upload(make_pdf("Great content. Check it out!"), "nh.pdf")
    h = r.json()["analysis"]["score_explanations"]["hashtags"]
    assert_eq(h["status"], "missing")
    assert_true(h["improvement"] is not None)
run("No hashtags -> explained", t_no_hashtags)

def t_no_cta():
    r = upload(make_pdf("Beautiful scenery. Mountains and rivers."), "nc.pdf")
    c = r.json()["analysis"]["score_explanations"]["cta"]
    assert_eq(c["status"], "missing")
    assert_true(c["improvement"] is not None)
run("No CTA -> explained", t_no_cta)

def t_all_expl():
    txt = "Did you know? Stop scrolling!\n- Post daily\n- Use hashtags\nWhat do you think? Comment!\n\nFollow us! #Social #Tips"
    r = upload(make_pdf(txt), "all.pdf")
    se = r.json()["analysis"]["score_explanations"]
    for k in ["length", "hashtags", "questions", "cta", "hook", "readability", "formatting", "energy", "variety"]:
        assert_true(k in se, f"{k} missing")
        assert_true("earned" in se[k])
        assert_true("max" in se[k])
        assert_true("status" in se[k])
        assert_true("detail" in se[k])
run("All 9 explanations complete", t_all_expl)

def t_score_sum():
    txt = "Buy now! #Deal #Sale\nWhat do you think? Comment!\nStop scrolling!"
    r = upload(make_pdf(txt), "sum.pdf")
    a = r.json()["analysis"]
    assert_eq(sum(a["score_breakdown"].values()), a["engagement_score"])
run("Score breakdown sum == score", t_score_sum)

print("\n=== DOWNLOAD ===")
def t_download():
    r = upload(make_pdf("Download test content"), "dl.pdf")
    did = r.json()["download_id"]
    assert_true(did is not None)
    r2 = client.get(f"/api/download/{did}")
    assert_eq(r2.status_code, 200)
    assert_true(r2.content[:4] == b"%PDF")
run("Download original file", t_download)

def t_dl_404():
    assert_eq(client.get("/api/download/nope").status_code, 404)
run("Download missing -> 404", t_dl_404)

print("\n=== ERROR CASES ===")
run("Invalid ext -> 400", lambda: assert_eq(upload(b"hi", "x.txt", "text/plain").status_code, 400))
run("Empty -> 400", lambda: assert_eq(upload(b"", "e.pdf", "application/pdf").status_code, 400))
run("Oversized -> 413", lambda: assert_eq(upload(b"\x00" * 11 * 1024 * 1024, "b.pdf", "application/pdf").status_code, 413))
def t_corrupt():
    r = upload(b"%PDF-1.4 garbage", "bad.pdf")
    assert_eq(r.json()["success"], False)
    assert_true("corrupt" in r.json()["message"].lower())
run("Corrupted PDF -> handled", t_corrupt)

print(f"\n{'='*50}")
print(f"RESULTS: {passed} passed, {failed} failed, {passed+failed} total")
print(f"{'='*50}")
sys.exit(1 if failed else 0)
