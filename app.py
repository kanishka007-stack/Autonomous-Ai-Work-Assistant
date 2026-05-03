import json
import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from openai import OpenAI

load_dotenv()

app = Flask(__name__)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """
You analyze emails for an AI task automation product.
Return only valid JSON with these keys:
{
  "intent": "short intent label",
  "reply": "professional suggested reply",
  "tasks": ["task 1", "task 2"]
}
If there are no tasks, return an empty tasks array.
"""


def fallback_analysis(email_text):
    lower_text = email_text.lower()
    intent = "general"

    if "meeting" in lower_text or "schedule" in lower_text or "call" in lower_text:
        intent = "meeting"
    elif "urgent" in lower_text or "asap" in lower_text:
        intent = "urgent"
    elif "task" in lower_text or "todo" in lower_text or "follow up" in lower_text:
        intent = "task"

    return {
        "intent": intent,
        "reply": "Thanks for the update. I will review this and follow up with the next steps shortly.",
        "tasks": [],
    }


def normalize_analysis(raw_analysis, email_text):
    fallback = fallback_analysis(email_text)

    if not isinstance(raw_analysis, dict):
        return fallback

    tasks = raw_analysis.get("tasks", [])
    if not isinstance(tasks, list):
        tasks = []

    return {
        "intent": str(raw_analysis.get("intent") or fallback["intent"]),
        "reply": str(raw_analysis.get("reply") or fallback["reply"]),
        "tasks": [str(task) for task in tasks],
    }


@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "ai-email-analyzer"})


@app.post("/analyze_email")
def analyze_email():
    data = request.get_json(silent=True) or {}
    email_text = data.get("email") or data.get("emailText") or data.get("text") or ""
    email_text = str(email_text).strip()

    if not email_text:
        return jsonify({"error": "Email text is required."}), 400

    if not os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_API_KEY") == "your_key_here":
        return jsonify(normalize_analysis({}, email_text))

    try:
        response = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-3.5-turbo"),
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": email_text},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
        )

        content = response.choices[0].message.content
        analysis = json.loads(content)
        return jsonify(normalize_analysis(analysis, email_text))
    except json.JSONDecodeError:
        return jsonify(fallback_analysis(email_text))
    except Exception as error:
        app.logger.exception("AI analysis failed")
        return (
            jsonify(
                {
                    "error": "AI service failed to analyze the email.",
                    "details": str(error),
                }
            ),
            502,
        )


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5001"))
    app.run(host="0.0.0.0", port=port, debug=os.getenv("FLASK_DEBUG") == "1")
