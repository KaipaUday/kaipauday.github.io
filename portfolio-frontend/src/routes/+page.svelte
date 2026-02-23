<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let code = $state('');
	let error = $state('');
	let dismissRouteError = $state(false);
	let isSubmitting = $state(false);

	const routeError = $derived.by(() => {
		const params = new URLSearchParams(page.url.search);
		return params.get('error') ?? '';
	});
	const routeErrorMessage = $derived.by(() => {
		if (routeError === 'code_not_found') return 'Access code not found.';
		if (routeError === 'code_expired') return 'Access code expired.';
		if (routeError === 'views_exhausted') return 'Access code has no remaining views.';
		if (routeError === 'service_unavailable') return 'Service is unavailable. Please try again.';
		if (routeError === 'invalid_code') return 'Invalid access code format.';
		if (routeError === 'bad_response') return 'Unexpected server response. Please try again.';
		if (routeError === 'code_invalid') return 'Access code is invalid.';
		return '';
	});
	const displayError = $derived(error || (!dismissRouteError ? routeErrorMessage : ''));

	$effect(() => {
		if (routeError) {
			dismissRouteError = false;
		}
	});

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		dismissRouteError = true;
		void openPortfolio();
	}

	async function openPortfolio() {
		const normalized = code.trim();
		if (!/^[A-Za-z0-9]{6}$/.test(normalized)) {
			error = 'Code must be exactly 6 alphanumeric characters.';
			return;
		}

		error = '';
		isSubmitting = true;
		try {
			await goto(`/${encodeURIComponent(normalized)}`);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="home">
	{#if isSubmitting}
		<div class="spinner-wrap" aria-live="polite" aria-label="Loading">
			<span class="spinner"></span>
		</div>
	{/if}

	<h1>Portfolio Access</h1>
	<p>Open your portfolio using a 6-character access code.</p>

	<form onsubmit={handleSubmit}>
		<div class="access">
			<input
				type="text"
				placeholder="Enter 6-character code"
				maxlength="6"
				bind:value={code}
				oninput={() => {
					error = '';
				}}
				disabled={isSubmitting}
			/>
			<button type="submit" disabled={isSubmitting}>Open</button>
		</div>
	</form>

	{#if displayError}
		<p class="error">{displayError}</p>
	{/if}

	<p>
		If you need access, email
		<a
			href="mailto:uday.kaipa.1@gmail.com?subject=Access Code Request to your portfolio website&body=Hi, Please send me the access code for your portfolio website."
			>uday.kaipa.1@gmail.com</a
		>.
	</p>
</div>

<style>
	.home {
		max-width: 720px;
		margin: 80px auto;
		padding: 24px;
		text-align: center;
	}

	.access {
		display: flex;
		gap: 10px;
		justify-content: center;
		margin: 18px 0 8px;
	}

	input {
		width: 260px;
		padding: 10px 12px;
		border: 1px solid #ccc;
		border-radius: 8px;
	}

	button {
		padding: 10px 14px;
		border: none;
		background: #111827;
		color: white;
		border-radius: 8px;
		cursor: pointer;
	}

	.error {
		color: #b91c1c;
		margin: 6px 0 12px;
	}

	.spinner-wrap {
		display: flex;
		justify-content: center;
		margin-bottom: 8px;
	}

	.spinner {
		width: 18px;
		height: 18px;
		border: 2px solid #d1d5db;
		border-top-color: #111827;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
