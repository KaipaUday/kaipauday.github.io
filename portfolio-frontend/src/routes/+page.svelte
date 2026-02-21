<script lang="ts">
	import { goto } from '$app/navigation';

	let code = '';
	let error = '';

	async function openPortfolio() {
		const normalized = code.trim();
		if (!/^[A-Za-z0-9]{6}$/.test(normalized)) {
			error = 'Code must be exactly 6 alphanumeric characters.';
			return;
		}

		error = '';
		await goto(`/${encodeURIComponent(normalized)}`);
	}
</script>

<div class="home">
	<h1>Portfolio Access</h1>
	<p>Open your portfolio using a 6-character access code.</p>

	<div class="access">
		<input
			type="text"
			placeholder="Enter 6-character code"
			maxlength="6"
			bind:value={code}
			oninput={() => (error = '')}
		/>
		<button onclick={openPortfolio}>Open</button>
	</div>

	{#if error}
		<p class="error">{error}</p>
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
</style>
