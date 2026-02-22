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

	type DetailSlide = 'experience' | 'projects' | 'education';
	type Slide = 'intro' | 'menu' | DetailSlide | 'certifications' | 'end';

	const detailOrder: DetailSlide[] = ['experience', 'projects', 'education'];

	let currentSlide = $state<Slide>('intro');
	let completed = $state<Record<DetailSlide, boolean>>({
		experience: false,
		projects: false,
		education: false
	});
	let sectionIndex = $state<Record<DetailSlide, number>>({
		experience: 0,
		projects: 0,
		education: 0
	});
	let maxSeenIndex = $state<Record<DetailSlide, number>>({
		experience: -1,
		projects: -1,
		education: -1
	});
	let hasVisitedMenu = $state(false);
	let hasVisitedCertifications = $state(false);
	let hasVisitedEnd = $state(false);

	const allDetailsCompleted = $derived(detailOrder.every((detail) => completed[detail]));

	const detailTitle = (detail: DetailSlide): string => {
		if (detail === 'experience') return 'Experience';
		if (detail === 'projects') return 'Projects';
		return 'Education';
	};

	function goToMenu() {
		hasVisitedMenu = true;
		currentSlide = 'menu';
	}

	function goToIntro() {
		currentSlide = 'intro';
	}

	function goToCertifications() {
		hasVisitedCertifications = true;
		currentSlide = 'certifications';
	}

	function goToEnd() {
		hasVisitedEnd = true;
		currentSlide = 'end';
	}

	function markCurrentItemSeen(detail: DetailSlide) {
		const currentIndex = sectionIndex[detail];
		if (currentIndex > maxSeenIndex[detail]) {
			maxSeenIndex[detail] = currentIndex;
		}
	}

	function openDetail(detail: DetailSlide) {
		completed[detail] = true;
		sectionIndex[detail] = 0;
		markCurrentItemSeen(detail);
		currentSlide = detail;
	}

	function detailCount(detail: DetailSlide): number {
		if (detail === 'experience') return portfolio.experience.length;
		if (detail === 'projects') return portfolio.project.length;
		return portfolio.education.length;
	}

	function canGoNextItem(detail: DetailSlide): boolean {
		return sectionIndex[detail] < detailCount(detail) - 1;
	}

	function canGoPreviousItem(detail: DetailSlide): boolean {
		return sectionIndex[detail] > 0;
	}

	function goToNextItem(detail: DetailSlide) {
		if (canGoNextItem(detail)) {
			sectionIndex[detail] += 1;
			markCurrentItemSeen(detail);
		}
	}

	function goToPreviousItem(detail: DetailSlide) {
		if (canGoPreviousItem(detail)) {
			sectionIndex[detail] -= 1;
		}
	}

	function seenUnits(detail: DetailSlide, actualCount: number): number {
		if (actualCount === 0) return completed[detail] ? 1 : 0;
		const seen = maxSeenIndex[detail] + 1;
		return Math.max(0, Math.min(seen, actualCount));
	}

	const expTotalUnits = $derived(Math.max(portfolio.experience.length, 1));
	const projTotalUnits = $derived(Math.max(portfolio.project.length, 1));
	const eduTotalUnits = $derived(Math.max(portfolio.education.length, 1));

	const totalProgressUnits = $derived(expTotalUnits + projTotalUnits + eduTotalUnits + 4);
	const completedProgressUnits = $derived(
		1 +
			(hasVisitedMenu ? 1 : 0) +
			seenUnits('experience', portfolio.experience.length) +
			seenUnits('projects', portfolio.project.length) +
			seenUnits('education', portfolio.education.length) +
			(hasVisitedCertifications ? 1 : 0) +
			(hasVisitedEnd ? 1 : 0)
	);
	const progressPercent = $derived(Math.round((completedProgressUnits / totalProgressUnits) * 100));
</script>

<div class="portfolio">
	<div class="progress-wrap">
		<div class="progress-track">
			<div class="progress-fill" style={`width: ${progressPercent}%`}></div>
		</div>
	</div>

	{#if currentSlide === 'intro'}
		<section class="slide">
			<h1>{portfolio.name || 'Portfolio Overview'}</h1>
			<p>{portfolio.summary || 'Welcome to my guided portfolio walkthrough.'}</p>
			<div class="meta">
				{#if portfolio.address}
					<span>{portfolio.address}</span>
				{/if}
				{#if portfolio.phone}
					<span>{portfolio.phone}</span>
				{/if}
				{#if portfolio.email}
					<span>{portfolio.email}</span>
				{/if}
				{#if portfolio.dob}
					<span>DOB: {portfolio.dob}</span>
				{/if}
				{#if availableViews !== null}
					<span>Views remaining: {availableViews}</span>
				{/if}
			</div>
			<div class="nav">
				<button class="nav-btn nav-next" onclick={goToMenu}>Next</button>
			</div>
		</section>
	{:else if currentSlide === 'menu'}
		<section class="slide">
			<h2>Main Menu</h2>
			<p>Select each section to unlock the certification slide.</p>
			<div class="menu-grid">
				<button
					class="menu-option"
					class:viewed={completed.experience}
					class:not-viewed={!completed.experience}
					onclick={() => openDetail('experience')}
				>
					Experience
					<span class="state">{completed.experience ? 'Viewed' : 'Not viewed'}</span>
				</button>
				<button
					class="menu-option"
					class:viewed={completed.projects}
					class:not-viewed={!completed.projects}
					onclick={() => openDetail('projects')}
				>
					Projects
					<span class="state">{completed.projects ? 'Viewed' : 'Not viewed'}</span>
				</button>
				<button
					class="menu-option"
					class:viewed={completed.education}
					class:not-viewed={!completed.education}
					onclick={() => openDetail('education')}
				>
					Education
					<span class="state">{completed.education ? 'Viewed' : 'Not viewed'}</span>
				</button>
			</div>
			<div class="nav">
				<button class="nav-btn nav-back" onclick={goToIntro}>&lt; Back</button>
				<button class="nav-btn nav-next" onclick={goToCertifications} disabled={!allDetailsCompleted}>
					Next
				</button>
			</div>
		</section>
	{:else if currentSlide === 'experience'}
		<section class="slide">
			<h2>{detailTitle(currentSlide)}</h2>
			{#if portfolio.experience.length === 0}
				<p>No experience data available.</p>
			{:else}
				<p class="position">Job {sectionIndex.experience + 1} of {portfolio.experience.length}</p>
				{@const item = portfolio.experience[sectionIndex.experience]}
				<article class="card">
					<h3>{item.company}</h3>
					<p class="sub">{item.role} | {item.location}</p>
					<p class="sub">{item.from} - {item.to}</p>
					<ul>
						{#each item.points as point}
							<li>{point}</li>
						{/each}
					</ul>
					{#if item.skills.length}
						<p class="chips">{item.skills.join(' · ')}</p>
					{/if}
				</article>
			{/if}
			<div class="nav">
				<button
					class="nav-btn nav-back"
					onclick={() => goToPreviousItem('experience')}
					disabled={!canGoPreviousItem('experience')}
				>
					&lt; Back
				</button>
				<button class="nav-btn nav-middle" onclick={goToMenu}>Return to Main Menu</button>
				<button
					class="nav-btn nav-next"
					onclick={() => goToNextItem('experience')}
					disabled={!canGoNextItem('experience')}
				>
					Next
				</button>
			</div>
		</section>
	{:else if currentSlide === 'projects'}
		<section class="slide">
			<h2>{detailTitle(currentSlide)}</h2>
			{#if portfolio.project.length === 0}
				<p>No project data available.</p>
			{:else}
				<p class="position">Project {sectionIndex.projects + 1} of {portfolio.project.length}</p>
				{@const item = portfolio.project[sectionIndex.projects]}
				<article class="card">
					<h3>{item.name}</h3>
					<p>{item.description}</p>
					{#if item.duration}
						<p class="sub">Duration: {item.duration}</p>
					{/if}
					{#if item.skills.length}
						<p class="chips">{item.skills.join(' · ')}</p>
					{/if}
				</article>
			{/if}
			<div class="nav">
				<button
					class="nav-btn nav-back"
					onclick={() => goToPreviousItem('projects')}
					disabled={!canGoPreviousItem('projects')}
				>
					&lt; Back
				</button>
				<button class="nav-btn nav-middle" onclick={goToMenu}>Return to Main Menu</button>
				<button
					class="nav-btn nav-next"
					onclick={() => goToNextItem('projects')}
					disabled={!canGoNextItem('projects')}
				>
					Next
				</button>
			</div>
		</section>
	{:else if currentSlide === 'education'}
		<section class="slide">
			<h2>{detailTitle(currentSlide)}</h2>
			{#if portfolio.education.length === 0}
				<p>No education data available.</p>
			{:else}
				<p class="position">Education {sectionIndex.education + 1} of {portfolio.education.length}</p>
				{@const item = portfolio.education[sectionIndex.education]}
				<article class="card">
					<h3>{item.university}</h3>
					<p class="sub">{item.course}</p>
					<p class="sub">{item.location} | {item.from} - {item.to}</p>
					<ul>
						{#each item.points as point}
							<li>{point}</li>
						{/each}
					</ul>
					{#if item.skills.length}
						<p class="chips">{item.skills.join(' · ')}</p>
					{/if}
				</article>
			{/if}
			<div class="nav">
				<button
					class="nav-btn nav-back"
					onclick={() => goToPreviousItem('education')}
					disabled={!canGoPreviousItem('education')}
				>
					&lt; Back
				</button>
				<button class="nav-btn nav-middle" onclick={goToMenu}>Return to Main Menu</button>
				<button
					class="nav-btn nav-next"
					onclick={() => goToNextItem('education')}
					disabled={!canGoNextItem('education')}
				>
					Next
				</button>
			</div>
		</section>
	{:else if currentSlide === 'certifications'}
		<section class="slide">
			<h2>Certifications</h2>
			{#if portfolio.certifications.length === 0}
				<p>No certifications listed.</p>
			{:else}
				<ul>
					{#each portfolio.certifications as cert}
						<li>{cert}</li>
					{/each}
				</ul>
			{/if}
			<div class="nav">
				<button class="nav-btn nav-back" onclick={goToMenu}>&lt; Back</button>
				<button class="nav-btn nav-next" onclick={goToEnd}>Next</button>
			</div>
		</section>
	{:else}
		<section class="slide">
			<h2>End</h2>
			<p>Thanks for reviewing my portfolio walkthrough.</p>
			<div class="nav">
				<button class="nav-btn nav-middle" onclick={goToIntro}>Start Over</button>
			</div>
		</section>
	{/if}
</div>

<style>
	.portfolio {
		max-width: 920px;
		margin: 40px auto;
		padding: 0 20px 40px;
	}

	.progress-wrap {
		margin-bottom: 12px;
	}

	.progress-track {
		height: 9px;
		border-radius: 999px;
		background: #dbeafe;
		border: 1px solid #93c5fd;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		border-radius: 999px;
		background: linear-gradient(90deg, #f97316 0%, #ea580c 100%);
		transition: width 0.25s ease;
	}

	.slide {
		padding: 24px;
		border: 1px solid #ddd;
		border-radius: 10px;
		background: #ffffff;
	}

	.slide h1,
	.slide h2 {
		margin: 0 0 10px;
	}

	.slide p {
		line-height: 1.5;
	}

	.meta {
		display: grid;
		gap: 6px;
		margin-top: 14px;
		font-size: 14px;
		color: #444;
	}

	.menu-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 12px;
		margin: 20px 0;
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

	.position {
		font-size: 13px;
		color: #4b5563;
		margin: 0 0 10px;
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

	.nav {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: 10px;
		margin-top: 16px;
	}

	.nav-back {
		justify-self: start;
	}

	.nav-middle {
		justify-self: center;
	}

	.nav-next {
		justify-self: end;
	}

	.nav-btn,
	.menu-option {
		padding: 10px 14px;
		border: 1px solid #cbd5e1;
		background: #f8fafc;
		color: #0f172a;
		border-radius: 8px;
		cursor: pointer;
		font-weight: 500;
		transition: background-color 0.2s ease, border-color 0.2s ease, opacity 0.2s ease;
	}

	.nav-btn:hover,
	.menu-option:hover {
		background: #f1f5f9;
		border-color: #94a3b8;
	}

	.nav-btn:disabled,
	.menu-option:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.menu-option {
		text-align: left;
	}

	.menu-option.viewed {
		opacity: 1;
	}

	.menu-option.not-viewed {
		opacity: 0.62;
	}

	.state {
		display: block;
		font-size: 12px;
		opacity: 0.8;
		margin-top: 4px;
	}

	@media (max-width: 720px) {
		.menu-grid {
			grid-template-columns: 1fr;
		}

		.nav {
			grid-template-columns: 1fr;
		}

		.nav-back,
		.nav-middle,
		.nav-next {
			justify-self: stretch;
		}
	}
</style>
