<script lang="ts">
	interface Props {
		onSubmit?: (data: { githubUsername: string; telegramChannel: string }) => void;
		isLoading?: boolean;
		error?: string;
	}

	let { onSubmit, isLoading = false, error = '' }: Props = $props();

	let githubUsername = $state('');
	let telegramChannel = $state('');
	let touched = $state({ github: false, telegram: false });

	let isValid = $derived(
		githubUsername.trim().length > 0 &&
		telegramChannel.trim().length > 0
	);

	let errors = $derived({
		github: touched.github && githubUsername.trim().length === 0 ? 'GitHub username is required' : '',
		telegram: touched.telegram && telegramChannel.trim().length === 0 ? 'Telegram channel is required' : ''
	});

	function handleSubmit(event: Event) {
		event.preventDefault();
		touched = { github: true, telegram: true };

		if (isValid && onSubmit) {
			onSubmit({
				githubUsername: githubUsername.trim(),
				telegramChannel: telegramChannel.trim()
			});
		}
	}

	function handleGithubInput(event: Event) {
		const target = event.target as HTMLInputElement;
		githubUsername = target.value;
	}

	function handleTelegramInput(event: Event) {
		const target = event.target as HTMLInputElement;
		telegramChannel = target.value;
	}
</script>

<form onsubmit={handleSubmit} class="space-y-5">
	{#if error}
		<div class="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm
		            animate-[fadeIn_0.2s_ease-out]">
			<div class="flex items-center gap-2">
				<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
					      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
				</svg>
				<span>{error}</span>
			</div>
		</div>
	{/if}

	<div class="space-y-2">
		<label for="github" class="block text-sm font-medium text-stone-300">
			GitHub Username
		</label>
		<div class="relative">
			<div class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
				<svg class="w-5 h-5 text-stone-500" fill="currentColor" viewBox="0 0 24 24">
					<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
				</svg>
			</div>
			<input
				type="text"
				id="github"
				value={githubUsername}
				oninput={handleGithubInput}
				onblur={() => touched.github = true}
				placeholder="octocat"
				class="w-full pl-12 pr-4 py-3 rounded-xl bg-stone-800/50 border border-stone-700/50
				       text-stone-100 placeholder:text-stone-500
				       transition-all duration-200 ease-[cubic-bezier(0.4,0.0,0.2,1)]
				       focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20
				       hover:border-stone-600/50
				       {errors.github ? 'border-rose-500/50 focus:border-rose-500/50 focus:ring-rose-500/20' : ''}"
			/>
		</div>
		{#if errors.github}
			<p class="text-xs text-rose-400 animate-[fadeIn_0.2s_ease-out]">{errors.github}</p>
		{/if}
	</div>

	<div class="space-y-2">
		<label for="telegram" class="block text-sm font-medium text-stone-300">
			Telegram Channel
		</label>
		<div class="relative">
			<div class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
				<svg class="w-5 h-5 text-stone-500" fill="currentColor" viewBox="0 0 24 24">
					<path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
				</svg>
			</div>
			<input
				type="text"
				id="telegram"
				value={telegramChannel}
				oninput={handleTelegramInput}
				onblur={() => touched.telegram = true}
				placeholder="@mychannel"
				class="w-full pl-12 pr-4 py-3 rounded-xl bg-stone-800/50 border border-stone-700/50
				       text-stone-100 placeholder:text-stone-500
				       transition-all duration-200 ease-[cubic-bezier(0.4,0.0,0.2,1)]
				       focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20
				       hover:border-stone-600/50
				       {errors.telegram ? 'border-rose-500/50 focus:border-rose-500/50 focus:ring-rose-500/20' : ''}"
			/>
		</div>
		{#if errors.telegram}
			<p class="text-xs text-rose-400 animate-[fadeIn_0.2s_ease-out]">{errors.telegram}</p>
		{/if}
		<p class="text-xs text-stone-500">
			Enter your Telegram channel username (with or without @)
		</p>
	</div>

	<button
		type="submit"
		disabled={isLoading}
		class="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium
		       transition-all duration-200 ease-[cubic-bezier(0.4,0.0,0.2,1)]
		       hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/25
		       active:scale-[0.98]
		       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
	>
		{#if isLoading}
			<div class="flex items-center justify-center gap-2">
				<svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
				<span>Registering...</span>
			</div>
		{:else}
			Join GitYap
		{/if}
	</button>
</form>

<style>
	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(-4px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>
