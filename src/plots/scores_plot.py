import json, io, base64
import matplotlib
matplotlib.use('agg')
import matplotlib.pyplot as plt
from js import document, window

data = json.loads(window.__pyodideData)

names = [d['name'] for d in data]
scores = [d['score'] for d in data]

fig, ax = plt.subplots(figsize=(6, 4))
ax.bar(names, scores, color='skyblue', edgecolor='steelblue')
ax.set_title('Player High Scores')
ax.set_ylabel('Score')
ax.set_xlabel('Player')
plt.xticks(rotation=30, ha='right')
plt.tight_layout()

buf = io.BytesIO()
fig.savefig(buf, format='png')
buf.seek(0)
img_b64 = base64.b64encode(buf.read()).decode('utf-8')
plt.close(fig)

target = document.getElementById('scores-chart')
target.innerHTML = f'<img src="data:image/png;base64,{img_b64}" alt="Scores Chart" style="width:100%" />'