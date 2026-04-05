const layers = [
	  {
		title: "9. Model Safety",
		color: "#ef4444",
		description: "Ensures responsible and safe AI outputs.",
		tools: ["LLM Guard", "Arthur AI", "Garak"]
	  },
	  {
		title: "8. Model Supervision",
		color: "#f97316",
		description: "Monitor, debug, and trace model performance.",
		tools: ["WhyLabs", "Fiddler", "Helicone"]
	  },
	  {
		title: "7. Synthetic Data",
		color: "#eab308",
		description: "Generate safe and scalable training data.",
		tools: ["Gretel", "Tonic AI", "Mostly"]
	  },
	  {
		title: "6. Embeddings & Labeling",
		color: "#84cc16",
		description: "Convert data into machine-readable formats.",
		tools: ["Cohere", "ScaleAI", "JinaAI", "Nomic"]
	  },
	  {
		title: "5. Fine-Tuning",
		color: "#22c55e",
		description: "Customize models for specific tasks.",
		tools: ["Weights & Biases", "HuggingFace", "OctoML"]
	  },
	  {
		title: "4. Vector DBs & Orchestration",
		color: "#06b6d4",
		description: "Memory and retrieval systems.",
		tools: ["Pinecone", "Weaviate", "Milvus", "LlamaIndex"]
	  },
	  {
		title: "3. Frameworks",
		color: "#3b82f6",
		description: "Build workflows and agents.",
		tools: ["LangChain", "HuggingFace", "FastAPI"]
	  },
	  {
		title: "2. Foundation Models",
		color: "#6366f1",
		description: "Core AI reasoning engines.",
		tools: ["GPT", "Claude", "Gemini", "Mistral", "DeepSeek"]
	  },
	  {
		title: "1. Cloud Hosting & Inference",
		color: "#8b5cf6",
		description: "Infrastructure powering AI systems.",
		tools: ["AWS", "Azure", "GCP", "NVIDIA"]
	  }
	];

	const pyramid = document.getElementById("pyramid");

	layers.forEach((layer, index) => {
	  const div = document.createElement("div");
	  div.className = "layer";

	  // Pyramid width effect
	  const width = 40 + index * 6;
	  div.style.width = width + "%";
	  div.style.background = layer.color;

	  div.innerHTML = `
		<div class="layer-title">${layer.title}</div>
		<div class="content">
		  <p>${layer.description}</p>
		  <div>${layer.tools.map(t => `<span class="tag">${t}</span>`).join("")}</div>
		</div>
	  `;

	  div.addEventListener("click", () => {
		div.classList.toggle("active");
	  });

	  pyramid.appendChild(div);
	});