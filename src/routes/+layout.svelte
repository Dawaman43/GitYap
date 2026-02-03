<script lang="ts">
	import '../app.css';
	import { browser } from '$app/environment';

	let { children } = $props();

	let isDark = $state(true);

	function toggleTheme() {
		isDark = !isDark;
		if (browser) {
			document.documentElement.classList.toggle('dark', isDark);
		}
	}
</script>

<svelte:head>
	<title>GitYap - Track Your GitHub vs Telegram Activity</title>
	<meta name="description" content="Compare your GitHub commits with Telegram messages. Are you a coder or a yapper?" />
	<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
</svelte:head>

<div class="min-h-screen bg-stone-950 text-stone-100 font-sans">
	<header class="sticky top-0 z-50 border-b border-stone-800/50 bg-stone-950/80 backdrop-blur-xl">
		<nav class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
			<a href="/" class="flex items-center gap-2 text-xl font-bold text-stone-100
			                transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]">
				<span class="text-2xl">🎯</span>
				<span>GitYap</span>
			</a>

			<div class="flex items-center gap-2">
				<a href="/leaderboard"
				   class="px-4 py-2 rounded-lg text-sm font-medium text-stone-400
				          transition-all duration-200 ease-[cubic-bezier(0.4,0.0,0.2,1)]
				          hover:text-stone-100 hover:bg-stone-800/50 hover:scale-[1.02]
				          active:scale-[0.98]">
					Leaderboard
				</a>

				<button
					onclick={toggleTheme}
					class="p-2 rounded-lg text-stone-400
					       transition-all duration-200 ease-[cubic-bezier(0.4,0.0,0.2,1)]
					       hover:text-stone-100 hover:bg-stone-800/50 hover:scale-[1.02]
					       active:scale-[0.98]"
					aria-label="Toggle theme"
				>
					{#if isDark}
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
							      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
						</svg>
					{:else}
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
							      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
						</svg>
					{/if}
				</button>
			</div>
		</nav>
	</header>

	<main>
		{@render children()}
	</main>

	<footer class="border-t border-stone-800/50 py-8 px-4">
		<div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
			<p class="text-sm text-stone-500">
				© {new Date().getFullYear()} GitYap. Track your coding vs chatting habits.
			</p>
			<div class="flex items-center gap-4 text-sm text-stone-500">
				<a href="https://github.com" target="_blank" rel="noopener noreferrer"
				   class="hover:text-stone-300 transition-colors duration-200">
					GitHub
				</a>
				<span class="text-stone-700">|</span>
				<a href="https://telegram.org" target="_blank" rel="noopener noreferrer"
				   class="hover:text-stone-300 transition-colors duration-200">
					Telegram
				</a>
			</div>
		</div>
	</footer>
</div>
