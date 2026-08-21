import re

HASHTAG_PATTERN = re.compile(r"#\w+")
QUESTION_PATTERN = re.compile(r"\?")
EXCLAMATION_PATTERN = re.compile(r"!")
EMOJI_PATTERN = re.compile(
    "["
    "\U0001F600-\U0001F64F"
    "\U0001F300-\U0001F5FF"
    "\U0001F680-\U0001F6FF"
    "\U0001F1E0-\U0001F1FF"
    "\U00002702-\U000027B0"
    "\U000024C2-\U0001F251"
    "\U0001f926-\U0001f937"
    "\U00010000-\U0010ffff"
    "\u200d"
    "\u2640-\u2642"
    "\ufe0f"
    "\u2600-\u2B55"
    "\u23cf"
    "\u23e9"
    "\u231a"
    "\u3030"
    "\u2934"
    "\u2935"
    "]+",
    flags=re.UNICODE,
)

CTA_KEYWORDS = [
    "buy now", "shop now", "click here", "sign up", "subscribe",
    "learn more", "get started", "join now", "try now", "download",
    "register", "book now", "order now", "contact us", "call now",
    "visit", "follow", "like", "share", "comment", "tag",
    "dm us", "link in bio", "swipe up", "tap the link",
    "limited time", "don't miss", "hurry", "act now", "grab yours",
]

HOOK_OPENERS = [
    "did you know", "what if", "imagine", "how would you",
    "stop scrolling", "wait", "breaking", "urgent", "alert",
    "new", "exclusive", "free", "secret", "hidden", "proven",
    "warning", "important", "announcing", "just announced",
    "you won't believe", "this changes everything",
]

DOCUMENT_HEADERS = re.compile(
    r"^\s*(abstract|introduction|conclusion|background|methodology|methods|"
    r"results|discussion|references|acknowledgements?|appendix|summary|"
    r"chapter\s+\d|section\s+\d|table of contents|bibliography)\s*[:.]?\s*$",
    re.IGNORECASE | re.MULTILINE,
)

CITATION_PATTERN = re.compile(
    r"\[\d+\]|\(\w+\s+et\s+al\.?,?\s+\d{4}\)|doi:|https?://\S+",
    re.IGNORECASE,
)

CODE_PATTERN = re.compile(
    r"(?:def\s+\w+|class\s+\w+|import\s+\w+|function\s+\w+|const\s+\w+|"
    r"if\s*\(|for\s*\(|while\s*\(|return\s+|#include|public\s+static)",
    re.MULTILINE,
)

REPORT_HEADERS = re.compile(
    r"^\s*(executive summary|project report|status report|table of contents|overview|key findings|findings|recommendations|project overview|milestones|deliverables|budget|appendix|summary of results)\s*[:.]?\s*$",
    re.IGNORECASE | re.MULTILINE,
)

TECHNICAL_TERMS_PATTERN = re.compile(
    r"\b(?:architecture|database|api|backend|frontend|server|framework|repository|deployment|configuration|refactoring|schema|endpoint|microservices|algorithm|pipeline|system requirements|prerequisites)\b",
    re.IGNORECASE,
)



def analyze_content(text: str, word_count: int = 0, character_count: int = 0) -> dict:
    if not text or not text.strip():
        return _empty_analysis()

    text_stripped = text.strip()

    wc = word_count if word_count > 0 else len(text_stripped.split())
    cc = character_count if character_count > 0 else len(text_stripped)

    sentences = _split_sentences(text_stripped)
    sentence_count = len(sentences)
    avg_sentence_length = round(wc / sentence_count, 1) if sentence_count > 0 else 0

    hashtag_count = len(HASHTAG_PATTERN.findall(text_stripped))
    question_count = len(QUESTION_PATTERN.findall(text_stripped))
    exclamation_count = len(EXCLAMATION_PATTERN.findall(text_stripped))
    emoji_count = len(EMOJI_PATTERN.findall(text_stripped))
    line_break_count = text_stripped.count("\n")

    cta_found = _detect_cta(text_stripped)
    hook_found = _detect_hook(text_stripped)
    has_bullet_points = _detect_bullet_points(text_stripped)
    has_emojis = emoji_count > 0
    has_exclamations = exclamation_count > 0

    score, score_breakdown = _calculate_engagement_score(
        word_count=wc,
        sentence_count=sentence_count,
        avg_sentence_length=avg_sentence_length,
        hashtag_count=hashtag_count,
        question_count=question_count,
        exclamation_count=exclamation_count,
        emoji_count=emoji_count,
        line_break_count=line_break_count,
        has_cta=bool(cta_found),
        has_hook=hook_found,
        has_bullet_points=has_bullet_points,
    )

    suitability = _assess_suitability(
        word_count=wc,
        sentence_count=sentence_count,
        avg_sentence_length=avg_sentence_length,
        hashtag_count=hashtag_count,
        question_count=question_count,
        exclamation_count=exclamation_count,
        emoji_count=emoji_count,
        line_break_count=line_break_count,
        has_cta=bool(cta_found),
        has_hook=hook_found,
        has_bullet_points=has_bullet_points,
        text=text_stripped,
    )

    strengths, improvements = _generate_strengths_and_improvements(
        word_count=wc,
        sentence_count=sentence_count,
        hashtag_count=hashtag_count,
        question_count=question_count,
        has_cta=bool(cta_found),
        has_hook=hook_found,
        has_emojis=has_emojis,
        has_exclamations=has_exclamations,
        has_bullet_points=has_bullet_points,
        avg_sentence_length=avg_sentence_length,
        line_break_count=line_break_count,
        cta_found=cta_found,
    )

    score_explanations = _generate_score_explanations(
        word_count=wc,
        sentence_count=sentence_count,
        avg_sentence_length=avg_sentence_length,
        hashtag_count=hashtag_count,
        question_count=question_count,
        has_cta=bool(cta_found),
        has_hook=hook_found,
        has_emojis=has_emojis,
        has_exclamations=has_exclamations,
        has_bullet_points=has_bullet_points,
        line_break_count=line_break_count,
        score_breakdown=score_breakdown,
    )

    suggestions = _generate_suggestions(
        word_count=wc,
        sentence_count=sentence_count,
        hashtag_count=hashtag_count,
        question_count=question_count,
        has_cta=bool(cta_found),
        has_hook=hook_found,
        has_emojis=has_emojis,
        has_exclamations=has_exclamations,
        has_bullet_points=has_bullet_points,
        avg_sentence_length=avg_sentence_length,
        line_break_count=line_break_count,
        cta_found=cta_found,
    )

    return {
        "metrics": {
            "word_count": wc,
            "character_count": cc,
            "sentence_count": sentence_count,
            "average_sentence_length": avg_sentence_length,
            "hashtag_count": hashtag_count,
            "question_count": question_count,
            "exclamation_count": exclamation_count,
            "emoji_count": emoji_count,
            "line_break_count": line_break_count,
            "has_cta": bool(cta_found),
            "has_hook": hook_found,
            "has_bullet_points": has_bullet_points,
            "cta_found": cta_found,
        },
        "engagement_score": score,
        "score_breakdown": score_breakdown,
        "score_explanations": score_explanations,
        "suitability": suitability,
        "content_type": suitability["content_type"],
        "suitability_confidence": suitability["suitability_confidence"],
        "score_applicability": suitability["score_applicability"],
        "score_applicability_reason": suitability["score_applicability_reason"],
        "classification_reasons": suitability["classification_reasons"],
        "strengths": strengths,
        "improvements": improvements,
        "suggestions": suggestions,
    }


def _empty_analysis() -> dict:
    suitability = {
        "label": "unknown",
        "suitability": "unknown",
        "reasons": ["No content to assess."],
        "content_type": "unknown",
        "suitability_confidence": 0,
        "score_applicability": "low",
        "score_applicability_reason": "No text content was provided to evaluate engagement score applicability.",
        "classification_reasons": ["No text content detected"],
    }
    return {
        "metrics": {
            "word_count": 0,
            "character_count": 0,
            "sentence_count": 0,
            "average_sentence_length": 0,
            "hashtag_count": 0,
            "question_count": 0,
            "exclamation_count": 0,
            "emoji_count": 0,
            "line_break_count": 0,
            "has_cta": False,
            "has_hook": False,
            "has_bullet_points": False,
            "cta_found": [],
        },
        "engagement_score": 0,
        "score_breakdown": {},
        "score_explanations": {},
        "suitability": suitability,
        "content_type": "unknown",
        "suitability_confidence": 0,
        "score_applicability": "low",
        "score_applicability_reason": "No text content was provided to evaluate engagement score applicability.",
        "classification_reasons": ["No text content detected"],
        "strengths": [],
        "improvements": [],
        "suggestions": ["No text content to analyze. Please upload a document with readable text."],
    }



def _split_sentences(text: str) -> list:
    parts = re.split(r"[.!?]+", text)
    sentences = [s.strip() for s in parts if s.strip() and len(s.strip()) > 2]
    return sentences


def _detect_cta(text: str) -> list:
    text_lower = text.lower()
    found = [cta for cta in CTA_KEYWORDS if cta in text_lower]
    return found


def _detect_hook(text: str) -> bool:
    first_100 = text[:100].lower()
    for hook in HOOK_OPENERS:
        if hook in first_100:
            return True
    if text.strip():
        first_sentence = _split_sentences(text)
        if first_sentence and first_sentence[0][0:1].isupper():
            return True
    return False


def _detect_bullet_points(text: str) -> bool:
    bullet_patterns = re.compile(r"^\s*[-*•▸▹►→]\s", re.MULTILINE)
    numbered_patterns = re.compile(r"^\s*\d+[.)]\s", re.MULTILINE)
    return bool(bullet_patterns.search(text)) or bool(numbered_patterns.search(text))


def _calculate_engagement_score(
    word_count,
    sentence_count,
    avg_sentence_length,
    hashtag_count,
    question_count,
    exclamation_count,
    emoji_count,
    line_break_count,
    has_cta,
    has_hook,
    has_bullet_points,
) -> tuple:
    breakdown = {}
    total = 0

    # Length optimization (0-15): sweet spot is 40-100 words for social media
    if 40 <= word_count <= 100:
        length_score = 15
    elif 20 <= word_count < 40 or 100 < word_count <= 150:
        length_score = 10
    elif 10 <= word_count < 20 or 150 < word_count <= 200:
        length_score = 6
    elif word_count > 0:
        length_score = 3
    else:
        length_score = 0
    breakdown["length"] = length_score
    total += length_score

    # Hashtags (0-15): 2-4 is ideal for engagement
    if 2 <= hashtag_count <= 4:
        hashtag_score = 15
    elif hashtag_count == 1 or hashtag_count == 5:
        hashtag_score = 10
    elif hashtag_count > 5:
        hashtag_score = 5
    else:
        hashtag_score = 0
    breakdown["hashtags"] = hashtag_score
    total += hashtag_score

    # Questions (0-10): at least one question invites interaction
    if question_count >= 2:
        question_score = 10
    elif question_count == 1:
        question_score = 8
    else:
        question_score = 0
    breakdown["questions"] = question_score
    total += question_score

    # CTA (0-15)
    cta_score = 15 if has_cta else 0
    breakdown["cta"] = cta_score
    total += cta_score

    # Hook/opening (0-10)
    hook_score = 10 if has_hook else 0
    breakdown["hook"] = hook_score
    total += hook_score

    # Readability (0-10): ideal avg sentence length is 8-20 words
    if sentence_count > 0 and 8 <= avg_sentence_length <= 20:
        readability_score = 10
    elif sentence_count > 0 and 5 <= avg_sentence_length < 8:
        readability_score = 7
    elif sentence_count > 0 and 20 < avg_sentence_length <= 30:
        readability_score = 6
    else:
        readability_score = 3 if sentence_count > 0 else 0
    breakdown["readability"] = readability_score
    total += readability_score

    # Formatting (0-10): line breaks and bullet points improve scannability
    format_score = 0
    if line_break_count >= 3:
        format_score += 5
    elif line_break_count >= 1:
        format_score += 3
    if has_bullet_points:
        format_score += 5
    format_score = min(format_score, 10)
    breakdown["formatting"] = format_score
    total += format_score

    # Emojis + exclamations (0-10): some personality helps
    energy_score = 0
    has_exclamations = exclamation_count > 0
    if has_exclamations and emoji_count > 0:
        energy_score = 10
    elif has_exclamations or emoji_count > 0:
        energy_score = 6
    breakdown["energy"] = energy_score
    total += energy_score

    # Variety bonus (0-5): multiple sentence lengths indicate better writing
    if sentence_count >= 3:
        variety_score = 5
    elif sentence_count >= 2:
        variety_score = 3
    else:
        variety_score = 0
    breakdown["variety"] = variety_score
    total += variety_score

    total = max(0, min(100, total))
    return total, breakdown


def _generate_suggestions(
    word_count,
    sentence_count,
    hashtag_count,
    question_count,
    has_cta,
    has_hook,
    has_emojis,
    has_exclamations,
    has_bullet_points,
    avg_sentence_length,
    line_break_count,
    cta_found,
) -> list:
    suggestions = []

    if word_count == 0:
        suggestions.append("No text content found. Ensure your document contains readable text.")
        return suggestions

    if hashtag_count == 0:
        suggestions.append(
            "Consider adding 2\u20134 relevant hashtags to increase discoverability."
        )
    elif hashtag_count == 1:
        suggestions.append(
            "Consider adding 1\u20133 more hashtags. 2\u20134 hashtags tend to perform well."
        )
    elif hashtag_count > 5:
        suggestions.append(
            "You have many hashtags. Consider reducing to 2\u20134 focused, relevant ones."
        )

    if question_count == 0:
        suggestions.append(
            "Consider adding a question to encourage audience interaction and comments."
        )

    if not has_cta:
        suggestions.append(
            "Consider adding a clear call to action (e.g., \u201cCheck it out,\u201d \u201cComment below,\u201d \u201cLink in bio\u201d)."
        )

    if not has_hook:
        suggestions.append(
            "Consider making the opening sentence more attention-grabbing to stop the scroll."
        )

    if not has_exclamations and word_count > 10:
        suggestions.append(
            "Consider adding exclamation marks to convey enthusiasm and energy."
        )

    if not has_emojis and word_count > 10:
        suggestions.append(
            "Consider adding relevant emojis to make the content more visually engaging."
        )

    if word_count < 20:
        suggestions.append(
            "Your content is quite short. Consider expanding with more detail or context."
        )
    elif word_count > 200:
        suggestions.append(
            "Your content is quite long. Consider trimming for better readability on social media."
        )

    if avg_sentence_length > 25:
        suggestions.append(
            "Some sentences are quite long. Breaking them up can improve readability."
        )

    if not has_bullet_points and word_count > 40:
        suggestions.append(
            "Consider using bullet points or lists to make key information scannable."
        )

    if line_break_count == 0 and word_count > 30:
        suggestions.append(
            "Consider adding line breaks to improve visual spacing and readability."
        )

    if sentence_count <= 1 and word_count > 15:
        suggestions.append(
            "Consider breaking your content into multiple sentences for better flow."
        )

    if not suggestions:
        suggestions.append(
            "Your content has strong engagement elements. Keep up the great work!"
        )

    return suggestions


def _assess_suitability(
    word_count, sentence_count, avg_sentence_length, hashtag_count,
    question_count, exclamation_count, emoji_count, line_break_count,
    has_cta, has_hook, has_bullet_points, text,
) -> dict:
    legacy_reasons = []
    classification_reasons = []

    is_short_form = 0 < word_count <= 200
    is_long_form = word_count > 200

    has_hashtags = hashtag_count >= 1
    has_interaction = question_count >= 1
    has_emojis_exc = emoji_count > 0 or exclamation_count > 0

    header_matches = DOCUMENT_HEADERS.findall(text)
    report_matches = REPORT_HEADERS.findall(text)
    citation_matches = CITATION_PATTERN.findall(text)
    code_matches = CODE_PATTERN.findall(text)
    tech_terms = TECHNICAL_TERMS_PATTERN.findall(text)

    has_academic_headers = bool(header_matches)
    has_report_headers = bool(report_matches)
    has_citations = len(citation_matches) >= 1
    has_code = len(code_matches) >= 1
    has_tech_terms = len(tech_terms) >= 1

    if not has_hashtags:
        legacy_reasons.append("No hashtags detected, which is uncommon for social media posts.")
    if is_long_form:
        legacy_reasons.append(f"Content is {word_count} words long, typical of documents rather than social posts.")
    if avg_sentence_length > 20:
        legacy_reasons.append("Average sentence length is high, suggesting formal/document-style writing.")
    if header_matches:
        legacy_reasons.append(f"Document-style headers detected (e.g., \"{header_matches[0].strip()}\"), indicating structured/academic content.")
    if len(citation_matches) >= 2:
        legacy_reasons.append("Multiple citations or references detected, suggesting academic/technical content.")
    if len(code_matches) >= 2:
        legacy_reasons.append("Code snippets detected, indicating technical/programming content.")

    # 1. Academic Document
    if (has_academic_headers and (has_citations or is_long_form)) or (has_citations and len(citation_matches) >= 2 and is_long_form):
        content_type = "academic_document"
        suitability_label = "likely_document"
        score_applicability = "low"
        score_applicability_reason = "The uploaded content appears to be an academic document rather than a social-media post."

        if is_long_form:
            classification_reasons.append("Long-form document structure detected")
        if has_academic_headers:
            classification_reasons.append("Academic section headings detected")
        if has_citations:
            classification_reasons.append("Reference/citation patterns detected")
        if avg_sentence_length > 20:
            classification_reasons.append("Formal writing style detected")
        if not classification_reasons:
            classification_reasons.append("Academic content structures and citations detected")

        confidence = 80
        if has_academic_headers:
            confidence += 10
        if has_citations:
            confidence += 10

    # 2. Technical / Project Report
    elif (has_report_headers or (is_long_form and (has_tech_terms or has_bullet_points) and not (has_hashtags or has_cta)) or ("report" in text.lower()[:200] and is_long_form)) and not has_code:
        content_type = "report"
        suitability_label = "likely_document"
        score_applicability = "low"
        score_applicability_reason = "The uploaded content appears to be a technical report rather than a social-media post."

        if is_long_form:
            classification_reasons.append("Long-form document structure detected")
        if has_report_headers or has_academic_headers:
            classification_reasons.append("Multiple section headings detected")
        if has_tech_terms:
            classification_reasons.append("Technical terminology detected")
        if has_citations:
            classification_reasons.append("Reference/citation patterns detected")
        if not classification_reasons:
            classification_reasons.append("Report section headings detected")

        confidence = 85
        if has_report_headers:
            confidence += 10

    # 3. Technical Document
    elif has_code or (has_tech_terms and len(tech_terms) >= 2) or (is_long_form and has_tech_terms and not (has_hashtags or has_cta or has_interaction)):
        content_type = "technical_document"
        suitability_label = "likely_document"
        score_applicability = "low"
        score_applicability_reason = "The uploaded content appears to be a technical document rather than a social-media post."

        if is_long_form:
            classification_reasons.append("Long-form document structure detected")
        if has_code:
            classification_reasons.append("Code snippets detected")
        if has_tech_terms:
            classification_reasons.append("Technical terminology detected")
        if has_academic_headers or has_report_headers:
            classification_reasons.append("Multiple section headings detected")
        if not classification_reasons:
            classification_reasons.append("Technical document markers detected")

        confidence = 85
        if has_code:
            confidence += 10

    # 4. Social Media
    elif has_hashtags or has_cta or (is_short_form and (has_interaction or has_hook or has_emojis_exc) and not (has_academic_headers or has_report_headers or is_long_form)):
        content_type = "social_media"
        social_score = (1 if is_short_form else 0) + (1 if has_hashtags else 0) + (1 if has_cta else 0) + (1 if has_interaction else 0) + (1 if has_emojis_exc else 0) + (1 if has_hook else 0)

        if social_score >= 2 or has_hashtags or has_cta:
            suitability_label = "likely_social_media"
            score_applicability = "high"
            score_applicability_reason = "The content exhibits strong social media characteristics, making the engagement score highly applicable."
            confidence = min(100, 60 + social_score * 8)
        else:
            suitability_label = "possibly_social_media"
            score_applicability = "medium"
            score_applicability_reason = "The content has some social media elements, so the engagement score is moderately applicable."
            confidence = 65

        if is_short_form:
            classification_reasons.append("Short-form content detected")
        if has_hashtags:
            classification_reasons.append("Hashtags detected")
        if has_cta:
            classification_reasons.append("Call to action detected")
        if has_interaction:
            classification_reasons.append("Audience interaction detected")
        if has_emojis_exc:
            classification_reasons.append("Visual emojis or enthusiastic tone detected")

        if not legacy_reasons:
            legacy_reasons.append("Content contains typical social media elements.")

    # 5. Article
    elif is_long_form and not (has_hashtags or has_cta) and sentence_count >= 5 and avg_sentence_length <= 25:
        content_type = "article"
        suitability_label = "likely_document"
        score_applicability = "medium"
        score_applicability_reason = "The content resembles a long-form article or blog post, so social media engagement metrics have medium applicability."
        classification_reasons = ["Long-form document structure detected", "Editorial paragraph flow detected"]
        confidence = 75

    # 6. Ambiguous / Unknown
    else:
        content_type = "unknown"
        suitability_label = "possibly_social_media"
        score_applicability = "medium"
        score_applicability_reason = "The content structure is ambiguous with minimal social or document markers, giving the engagement score medium applicability."
        classification_reasons = ["General text without specific social media or document structure markers"]
        legacy_reasons.append("Content has mixed characteristics. Analysis may be less meaningful.")
        confidence = 50

    confidence = max(0, min(100, confidence))

    return {
        "label": suitability_label,
        "suitability": suitability_label,
        "reasons": legacy_reasons,
        "content_type": content_type,
        "suitability_confidence": confidence,
        "score_applicability": score_applicability,
        "score_applicability_reason": score_applicability_reason,
        "classification_reasons": classification_reasons,
    }



def _generate_strengths_and_improvements(
    word_count, sentence_count, hashtag_count, question_count,
    has_cta, has_hook, has_emojis, has_exclamations,
    has_bullet_points, avg_sentence_length, line_break_count, cta_found,
) -> tuple:
    strengths = []
    improvements = []

    if hashtag_count >= 2:
        strengths.append(f"Using {hashtag_count} hashtags helps with discoverability.")
    elif hashtag_count == 1:
        improvements.append("Add 1\u20133 more hashtags. 2\u20134 hashtags tend to perform best.")
    else:
        improvements.append("Add 2\u20134 relevant hashtags to increase discoverability.")

    if question_count >= 1:
        strengths.append("Including questions encourages audience interaction.")
    else:
        improvements.append("Add a question to invite comments and engagement.")

    if has_cta:
        cta_list = ", ".join(cta_found[:3])
        strengths.append(f"Contains a call to action ({cta_list}), which drives engagement.")
    else:
        improvements.append("Add a clear call to action (e.g., \"Comment below\", \"Link in bio\").")

    if has_hook:
        strengths.append("Opening line grabs attention effectively.")
    else:
        improvements.append("Make the opening sentence more attention-grabbing to stop the scroll.")

    if has_exclamations and has_emojis:
        strengths.append("Exclamations and emojis add energy and personality.")
    elif has_exclamations:
        strengths.append("Exclamation marks convey enthusiasm.")
        improvements.append("Consider adding emojis to boost visual engagement.")
    elif has_emojis:
        strengths.append("Emojis make the content visually engaging.")
        improvements.append("Consider adding exclamation marks for more energy.")
    else:
        improvements.append("Add exclamation marks and/or emojis to convey energy.")

    if 40 <= word_count <= 150:
        strengths.append(f"Content length ({word_count} words) is well-suited for social media.")
    elif word_count < 20:
        improvements.append("Content is very short. Consider expanding with more detail.")
    elif word_count > 200:
        improvements.append("Content is long for social media. Consider trimming for readability.")

    if has_bullet_points:
        strengths.append("Bullet points improve scannability.")

    if avg_sentence_length > 0 and avg_sentence_length <= 20:
        strengths.append("Sentence length is easy to read on mobile.")

    return strengths, improvements


def _generate_score_explanations(
    word_count, sentence_count, avg_sentence_length, hashtag_count,
    question_count, has_cta, has_hook, has_emojis, has_exclamations,
    has_bullet_points, line_break_count, score_breakdown,
) -> dict:
    explanations = {}

    explanations["length"] = _explain_length(word_count, score_breakdown.get("length", 0))
    explanations["hashtags"] = _explain_hashtags(hashtag_count, score_breakdown.get("hashtags", 0))
    explanations["questions"] = _explain_questions(question_count, score_breakdown.get("questions", 0))
    explanations["cta"] = _explain_cta(has_cta, score_breakdown.get("cta", 0))
    explanations["hook"] = _explain_hook(has_hook, score_breakdown.get("hook", 0))
    explanations["readability"] = _explain_readability(avg_sentence_length, sentence_count, score_breakdown.get("readability", 0))
    explanations["formatting"] = _explain_formatting(line_break_count, has_bullet_points, score_breakdown.get("formatting", 0))
    explanations["energy"] = _explain_energy(has_exclamations, has_emojis, score_breakdown.get("energy", 0))
    explanations["variety"] = _explain_variety(sentence_count, score_breakdown.get("variety", 0))

    return explanations


def _explain_length(wc, points):
    max_pts = 15
    if 40 <= wc <= 100:
        return {"earned": points, "max": max_pts, "status": "good", "detail": f"{wc} words \u2014 ideal length for social media.", "improvement": None}
    elif 20 <= wc < 40 or 100 < wc <= 150:
        return {"earned": points, "max": max_pts, "status": "ok", "detail": f"{wc} words \u2014 close to the optimal range (40\u2013100).", "improvement": "Aim for 40\u2013100 words for best engagement."}
    elif wc > 150:
        return {"earned": points, "max": max_pts, "status": "needs_improvement", "detail": f"{wc} words \u2014 content is long for social media.", "improvement": "Trim to 40\u2013100 words for better readability."}
    elif wc > 0:
        return {"earned": points, "max": max_pts, "status": "needs_improvement", "detail": f"{wc} words \u2014 content is quite short.", "improvement": "Expand to 40\u2013100 words for more impact."}
    else:
        return {"earned": 0, "max": max_pts, "status": "missing", "detail": "No words detected.", "improvement": "Add content to analyze."}


def _explain_hashtags(count, points):
    max_pts = 15
    if 2 <= count <= 4:
        return {"earned": points, "max": max_pts, "status": "good", "detail": f"{count} hashtags \u2014 optimal range for engagement.", "improvement": None}
    elif count == 1:
        return {"earned": points, "max": max_pts, "status": "ok", "detail": "1 hashtag found.", "improvement": "Add 1\u20133 more hashtags for better discoverability."}
    elif count > 5:
        return {"earned": points, "max": max_pts, "status": "needs_improvement", "detail": f"{count} hashtags \u2014 too many can reduce engagement.", "improvement": "Reduce to 2\u20134 focused, relevant hashtags."}
    else:
        return {"earned": 0, "max": max_pts, "status": "missing", "detail": "No hashtags detected.", "improvement": "Add 2\u20134 relevant hashtags to increase reach."}


def _explain_questions(count, points):
    max_pts = 10
    if count >= 2:
        return {"earned": points, "max": max_pts, "status": "good", "detail": f"{count} questions found \u2014 encourages interaction.", "improvement": None}
    elif count == 1:
        return {"earned": points, "max": max_pts, "status": "good", "detail": "1 question found \u2014 invites engagement.", "improvement": None}
    else:
        return {"earned": 0, "max": max_pts, "status": "missing", "detail": "No questions detected.", "improvement": "Add a question to encourage comments and interaction."}


def _explain_cta(has_cta, points):
    max_pts = 15
    if has_cta:
        return {"earned": points, "max": max_pts, "status": "good", "detail": "A clear call to action was detected.", "improvement": None}
    else:
        return {"earned": 0, "max": max_pts, "status": "missing", "detail": "No call to action detected.", "improvement": "Add a CTA like \"Check it out\", \"Comment below\", or \"Link in bio\"."}


def _explain_hook(has_hook, points):
    max_pts = 10
    if has_hook:
        return {"earned": points, "max": max_pts, "status": "good", "detail": "Opening line grabs attention.", "improvement": None}
    else:
        return {"earned": 0, "max": max_pts, "status": "missing", "detail": "No attention-grabbing opener detected.", "improvement": "Start with a hook like \"Did you know?\", \"Stop scrolling!\", or a bold statement."}


def _explain_readability(avg_len, sentence_count, points):
    max_pts = 10
    if sentence_count > 0 and 8 <= avg_len <= 20:
        return {"earned": points, "max": max_pts, "status": "good", "detail": f"Average {avg_len} words per sentence \u2014 easy to read on mobile.", "improvement": None}
    elif sentence_count > 0 and 5 <= avg_len < 8:
        return {"earned": points, "max": max_pts, "status": "ok", "detail": f"Average {avg_len} words per sentence \u2014 slightly short but clear.", "improvement": "Varying sentence length can improve flow."}
    elif sentence_count > 0 and 20 < avg_len <= 30:
        return {"earned": points, "max": max_pts, "status": "needs_improvement", "detail": f"Average {avg_len} words per sentence \u2014 somewhat long for social media.", "improvement": "Break long sentences into shorter ones."}
    elif sentence_count > 0:
        return {"earned": points, "max": max_pts, "status": "needs_improvement", "detail": f"Average {avg_len} words per sentence.", "improvement": "Aim for 8\u201320 words per sentence for readability."}
    else:
        return {"earned": 0, "max": max_pts, "status": "missing", "detail": "No sentences detected.", "improvement": "Add readable content with clear sentence structure."}


def _explain_formatting(line_breaks, has_bullets, points):
    max_pts = 10
    if has_bullets and line_breaks >= 3:
        return {"earned": points, "max": max_pts, "status": "good", "detail": "Good use of line breaks and bullet points for scannability.", "improvement": None}
    elif has_bullets:
        return {"earned": points, "max": max_pts, "status": "good", "detail": "Bullet points improve readability.", "improvement": "Add more line breaks for better visual spacing."}
    elif line_breaks >= 3:
        return {"earned": points, "max": max_pts, "status": "ok", "detail": "Line breaks present for spacing.", "improvement": "Consider adding bullet points to highlight key information."}
    else:
        return {"earned": points, "max": max_pts, "status": "needs_improvement", "detail": "Minimal formatting detected.", "improvement": "Use line breaks and bullet points to make content scannable."}


def _explain_energy(has_exc, has_emojis, points):
    max_pts = 10
    if has_exc and has_emojis:
        return {"earned": points, "max": max_pts, "status": "good", "detail": "Exclamations and emojis add energy and personality.", "improvement": None}
    elif has_exc:
        return {"earned": points, "max": max_pts, "status": "ok", "detail": "Exclamations convey enthusiasm.", "improvement": "Add emojis to boost visual engagement."}
    elif has_emojis:
        return {"earned": points, "max": max_pts, "status": "ok", "detail": "Emojis add visual appeal.", "improvement": "Add exclamation marks for more energy."}
    else:
        return {"earned": 0, "max": max_pts, "status": "missing", "detail": "No exclamations or emojis detected.", "improvement": "Add exclamation marks and/or emojis to convey personality."}


def _explain_variety(sentence_count, points):
    max_pts = 5
    if sentence_count >= 3:
        return {"earned": points, "max": max_pts, "status": "good", "detail": f"{sentence_count} sentences with varied structure.", "improvement": None}
    elif sentence_count >= 2:
        return {"earned": points, "max": max_pts, "status": "ok", "detail": "A couple of sentences with some variety.", "improvement": "Adding more sentences with varied lengths improves flow."}
    else:
        return {"earned": 0, "max": max_pts, "status": "needs_improvement", "detail": "Very few sentences detected.", "improvement": "Use multiple sentences with varied lengths for better readability."}
