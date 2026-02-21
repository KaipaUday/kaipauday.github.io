<script lang="ts">
	type Experience = {
		company: string;
		role: string;
		location: string;
		from: string;
		to: string;
		points: string[];
		skills: string[];
	};

	type Education = {
		university: string;
		course: string;
		location: string;
		from: string;
		to: string;
		points: string[];
		skills: string[];
	};

	type Project = {
		name: string;
		description: string;
		duration: string;
		skills: string[];
	};

	type PortfolioData = {
		name: string;
		address: string;
		phone: string;
		email: string;
		dob: string;
		summary: string;
		experience: Experience[];
		education: Education[];
		certifications: string[];
		project: Project[];
	};

	const toStringArray = (value: unknown): string[] => {
		if (!Array.isArray(value)) return [];
		return value.map((item) => String(item ?? '')).filter(Boolean);
	};

	const normalizeExperience = (value: unknown): Experience[] => {
		if (!Array.isArray(value)) return [];
		return value.map((item) => {
			const exp = (item ?? {}) as Record<string, unknown>;
			return {
				company: String(exp.company ?? ''),
				role: String(exp.role ?? ''),
				location: String(exp.location ?? ''),
				from: String(exp.from ?? ''),
				to: String(exp.to ?? ''),
				points: toStringArray(exp.points),
				skills: toStringArray(exp.skills)
			};
		});
	};

	const normalizeEducation = (value: unknown): Education[] => {
		if (!Array.isArray(value)) return [];
		return value.map((item) => {
			const edu = (item ?? {}) as Record<string, unknown>;
			return {
				university: String(edu.university ?? ''),
				course: String(edu.course ?? ''),
				location: String(edu.location ?? ''),
				from: String(edu.from ?? ''),
				to: String(edu.to ?? ''),
				points: toStringArray(edu.points),
				skills: toStringArray(edu.skills)
			};
		});
	};

	const normalizeProjects = (value: unknown): Project[] => {
		if (!Array.isArray(value)) return [];
		return value.map((item) => {
			const project = (item ?? {}) as Record<string, unknown>;
			return {
				name: String(project.name ?? ''),
				description: String(project.description ?? ''),
				duration: String(project.duration ?? ''),
				skills: toStringArray(project.skills)
			};
		});
	};

	const emptyData = (): PortfolioData => ({
		name: '',
		address: '',
		phone: '',
		email: '',
		dob: '',
		summary: '',
		experience: [],
		education: [],
		certifications: [],
		project: []
	});

	const parseMaybeJson = (value: unknown): unknown => {
		if (typeof value !== 'string') return value;
		try {
			return JSON.parse(value);
		} catch {
			return value;
		}
	};

	const findSourceObject = (payload: unknown): Record<string, unknown> | null => {
		const parsedPayload = parseMaybeJson(payload);
		if (!parsedPayload || typeof parsedPayload !== 'object') return null;

		const root = parsedPayload as Record<string, unknown>;
		const candidates: unknown[] = [
			root.data,
			root.cv,
			root.payload,
			root.response,
			root.result,
			root.portfolio,
			root
		];

		for (const candidate of candidates) {
			const parsedCandidate = parseMaybeJson(candidate);
			if (parsedCandidate && typeof parsedCandidate === 'object') {
				return parsedCandidate as Record<string, unknown>;
			}
		}

		return null;
	};

	const normalizeData = (payload: unknown): PortfolioData => {
		const source = findSourceObject(payload);
		if (!source) return emptyData();

		return {
			name: String(source.name ?? ''),
			address: String(source.address ?? ''),
			phone: String(source.phone ?? ''),
			email: String(source.email ?? ''),
			dob: String(source.dob ?? ''),
			summary: String(source.summary ?? ''),
			experience: normalizeExperience(source.experience),
			education: normalizeEducation(source.education),
			certifications: toStringArray(source.certifications),
			project: normalizeProjects(source.project)
		};
	};

	let { data } = $props<{
		data: {
			code: string;
			payload: {
				code?: string;
				data?: unknown;
				available_views?: number;
			};
			errorMessage: string | null;
		};
	}>();

	const portfolio = $derived(normalizeData(data.payload));
	const availableViews = $derived(
		typeof data.payload?.available_views === 'number' ? data.payload.available_views : null
	);
	
</script>

<div class="portfolio">
	<header class="hero">
		<h1>{portfolio.name}</h1>
		<p>{portfolio.summary}</p>
		<div class="meta">
			<span>{portfolio.address}</span>
			<span>{portfolio.phone}</span>
			<span>{portfolio.email}</span>
			<span>DOB: {portfolio.dob}</span>
			{#if availableViews !== null}
				<span>Views remaining: {availableViews}</span>
			{/if}
		</div>
	</header>

	<section>
		<h2>Experience</h2>
		{#if portfolio.experience.length === 0}
			<p>No experience data available.</p>
		{:else}
			{#each portfolio.experience as item}
				<article class="card">
					<h3>{item.company}</h3>
					<p class="sub">{item.role} | {item.location}</p>
					<p class="sub">{item.from} - {item.to}</p>
					<ul>
						{#each item.points as point}
							<li>{point}</li>
						{/each}
					</ul>
					<p class="chips">{item.skills.join(' · ')}</p>
				</article>
			{/each}
		{/if}
	</section>

	<section>
		<h2>Education</h2>
		{#if portfolio.education.length === 0}
			<p>No education data available.</p>
		{:else}
			{#each portfolio.education as item}
				<article class="card">
					<h3>{item.university}</h3>
					<p class="sub">{item.course}</p>
					<p class="sub">{item.location} | {item.from} - {item.to}</p>
					<ul>
						{#each item.points as point}
							<li>{point}</li>
						{/each}
					</ul>
					<p class="chips">{item.skills.join(' · ')}</p>
				</article>
			{/each}
		{/if}
	</section>

	<section>
		<h2>Certifications</h2>
		<ul>
			{#each portfolio.certifications as cert}
				<li>{cert}</li>
			{/each}
		</ul>
	</section>

	<section>
		<h2>Projects</h2>
		{#if portfolio.project.length === 0}
			<p>No project data available.</p>
		{:else}
			{#each portfolio.project as item}
				<article class="card">
					<h3>{item.name}</h3>
					<p>{item.description}</p>
					{#if item.duration}
						<p class="sub">Duration: {item.duration}</p>
					{/if}
					<p class="chips">{item.skills.join(' · ')}</p>
				</article>
			{/each}
		{/if}
	</section>
</div>

<style>
	.portfolio {
		max-width: 900px;
		margin: 40px auto;
		padding: 0 20px 40px;
	}

	.hero {
		padding: 24px;
		border: 1px solid #ddd;
		border-radius: 10px;
		margin-bottom: 22px;
	}

	.hero h1 {
		margin: 0 0 10px;
	}

	.hero p {
		line-height: 1.5;
	}

	.meta {
		display: grid;
		gap: 6px;
		margin-top: 14px;
		font-size: 14px;
		color: #444;
	}

	section {
		margin-bottom: 20px;
	}

	h2 {
		margin-bottom: 10px;
	}

	.card {
		border: 1px solid #ddd;
		border-radius: 10px;
		padding: 14px;
		margin-bottom: 12px;
	}

	.card h3 {
		margin: 0 0 6px;
	}

	.sub {
		font-size: 14px;
		color: #555;
		margin: 0 0 8px;
	}

	ul {
		margin: 8px 0;
		padding-left: 18px;
	}

	li {
		margin-bottom: 5px;
	}

	.chips {
		font-size: 13px;
		color: #1f2937;
		margin: 10px 0 0;
	}
</style>
