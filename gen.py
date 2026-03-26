import os
import json

base_dir = r"e:\Rushikesh\project M - Copy"

def create_dummy(subject, count):
    q = []
    for i in range(1, count + 1):
        q.append({
            "question": f"Question #{i} for {subject}?",
            "options": ["A", "B", "C", "D"],
            "answer": 0,
            "explanation": f"Explanation for #{i}"
        })
    os.makedirs(os.path.join(base_dir, 'data'), exist_ok=True)
    with open(os.path.join(base_dir, f'data/{subject}.json'), 'w') as f:
        json.dump(q, f, indent=2)

create_dummy('soft_skills', 120)  # Total 120 -> 3 sets (50, 50, 20)
create_dummy('os', 60) # Total 60 -> 2 sets (50, 10)
create_dummy('cn', 30) # Total 30 -> 1 set

for f in ['quiz.html', 'quiz.js', 'quiz.css']:
    try: os.remove(os.path.join(base_dir, f))
    except: pass
