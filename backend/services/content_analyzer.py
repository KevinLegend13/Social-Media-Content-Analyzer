import re
from collections import Counter

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
        "suggestions": suggestions,
    }


def _empty_analysis() -> dict:
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
