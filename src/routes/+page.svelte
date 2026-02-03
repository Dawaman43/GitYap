<script lang="ts">
	import RegistrationForm from '$lib/components/RegistrationForm.svelte';
	import StatsCard from '$lib/components/StatsCard.svelte';
	import SimilarUsersGrid from '$lib/components/SimilarUsersGrid.svelte';
	import { goto } from '$app/navigation';

	let isLoading = $state(false);
	let error = $state('');
	let loadingStats = $state(true);
	let loadingUsers = $state(true);
	let statsError = $state('');
	let usersError = $state('');
	let quickStats = $state<{ value: string; label: string; icon: string }[]>([]);
	let featuredUsers = $state<any[]>([]);
	let totalUsers = $state(0);

	async function loadStats() {
		try {
			const response = await fetch('/api/leaderboard?page=1&sort=total&order=desc');
			if (!response.ok) throw new Error('Failed to load stats');
			const data = await response.json();
			
			const totalCommits = data.users.reduce((sum: number, u: any) => sum + (u.githubCommits || 0), 0);
			const totalMessages = data.users.reduce((sum: number, u: any) => sum + (u.telegramMessages || 0), 0);
			
			quickStats = [
				{ value: formatNumber(data.totalCount), label: 'Active Users', icon: '👥' },
				{ value: formatNumber(totalCommits), label: 'GitHub Commits', icon: '💻' },
				{ value: formatNumber(totalMessages), label: 'Telegram Messages', icon: '💬' }
			];
			
			totalUsers = data.totalCount;
			featuredUsers = data.users.slice(0, 4).map((u: any) => ({
				id: u.username,
				username: u.username,
				githubUsername: u.username,
				telegramChannel: '@' + u.username,
				commits: u.githubCommits,
				messages: u.telegramMessages,
				ratio: u.ratio,
				badge: u.ratio > 2 ? 'yapper' : u.ratio < 0.5 ? 'coder' : 'balanced'
			}));
		} catch (e) {
			statsError = 'Could not load stats';
			quickStats = [
				{ value: '-', label: 'Active Users', icon: '👥' },
				{ value: '-', label: 'GitHub Commits', icon: '💻' },
				{ value: '-', label: 'Telegram Messages', icon: '💬' }
			];
		} finally {
			loadingStats = false;
			loadingUsers = false;
		}
	}

	function formatNumber(num: number): string {
		if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
		if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
		return num.toString();
	}

	async function handleRegister(data: { githubUsername: string; telegramChannel: string }) {
		isLoading = true;
		error = '';

		try {
			const response = await fetch('/api/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data)
			});

			const result = await response.json();

			if (!response.ok) {
				error = result.message || 'Registration failed';
				return;
			}

			goto(`/${data.githubUsername}`);
		} catch (e) {
			error = 'Network error. Please try again.';
		} finally {
			isLoading = false;
		}
	}

	$effect(() => {
		loadStats();
	});
</script>

<svelte:head>
	<title>GitYap - Track Your GitHub vs Telegram Activity</title>
	<meta name="description" content="Compare your GitHub commits with Telegram messages. Are you a coder or a yapper?" />
</svelte:head>

<div class="min-h-[calc(100vh-4rem)] flex flex-col">
	<section class="relative py-16 sm:py-24 px-4">
		<div class="max-w-4xl mx-auto text-center space-y-6">
			<div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-stone-800/50 border border-stone-700/50 text-sm text-stone-400">
				<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
				Track your coding vs chatting habits
			</div>

			<h1 class="text-4xl sm:text-6xl font-bold text-stone-100 tracking-tight">
				Are you a <span class="text-blue-400">Coder</span> or a <span class="text-amber-400">Yapper</span>?
			</h1>

			<p class="text-lg sm:text-xl text-stone-400 max-w-2xl mx-auto leading-relaxed">
				GitYap tracks your GitHub commits and Telegram messages to reveal your true digital personality.
				Join developers discovering their coding-chatting balance.
			</p>

			<div class="grid grid-cols-3 gap-4 max-w-2xl mx-auto pt-4">
				{#if loadingStats}
					{#each [1, 2, 3] as _}
						<div class="rounded-xl bg-stone-800/30 p-4 animate-pulse">
							<div class="h-8 w-16 bg-stone-700/50 rounded mb-2 mx-auto"></div>
							<div class="h-4 w-20 bg-stone-700/50 rounded mx-auto"></div>
						</div>
					{/each}
				{:else}
					{#each quickStats as stat}
						<StatsCard
							value={stat.value}
							label={stat.label}
							icon={stat.icon}
						/>
					{/each}
				{/if}
			</div>
		</div>
	</section>

	<section class="py-12 px-4">
		<div class="max-w-md mx-auto">
			<div class="rounded-2xl bg-stone-800/50 p-8 border border-stone-700/50 shadow-xl shadow-black/10">
				<div class="text-center mb-6">
					<h2 class="text-2xl font-semibold text-stone-200 mb-2">Get Started</h2>
					<p class="text-sm text-stone-400">Enter your details to join GitYap</p>
				</div>

				<RegistrationForm
					onSubmit={handleRegister}
					isLoading={isLoading}
					{error}
				/>
			</div>
		</div>
	</section>

	{#if totalUsers > 0}
		<section class="py-12 px-4 flex-1">
			<div class="max-w-6xl mx-auto">
				<div class="flex items-center justify-between mb-8">
					<div>
						<h2 class="text-2xl font-semibold text-stone-200">Featured Users</h2>
						<p class="text-sm text-stone-400 mt-1">See how others compare</p>
					</div>
					<a href="/leaderboard" class="text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200">
						View all users →
					</a>
				</div>

				<SimilarUsersGrid
					users={featuredUsers}
					{totalUsers}
					currentPage={1}
					pageSize={4}
				/>
			</div>
		</section>
	{/if}
</div>
