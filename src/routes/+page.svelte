<script lang="ts">
	import RegistrationForm from '$lib/components/RegistrationForm.svelte';
	import StatsCard from '$lib/components/StatsCard.svelte';
	import SimilarUsersGrid from '$lib/components/SimilarUsersGrid.svelte';
	import { goto } from '$app/navigation';

	let isLoading = $state(false);
	let error = $state('');
	let registeredUser = $state<{ username: string; githubUsername: string } | null>(null);

	const quickStats = [
		{ value: '1.2K+', label: 'Active Users', icon: '👥' },
		{ value: '50K+', label: 'GitHub Commits', icon: '💻' },
		{ value: '200K+', label: 'Telegram Messages', icon: '💬' }
	];

	const demoUsers = [
		{ id: '1', username: 'alice', githubUsername: 'alicecodes', telegramChannel: '@alice_dev', commits: 1234, messages: 567, score: 85.5, badge: 'coder' as const },
		{ id: '2', username: 'bob', githubUsername: 'bobtalks', telegramChannel: '@bob_chat', commits: 234, messages: 3456, score: 72.3, badge: 'yapper' as const },
		{ id: '3', username: 'carol', githubUsername: 'carolbal', telegramChannel: '@carol_both', commits: 789, messages: 890, score: 88.1, badge: 'balanced' as const },
		{ id: '4', username: 'dave', githubUsername: 'davegit', telegramChannel: '@dave_dev', commits: 2345, messages: 123, score: 91.2, badge: 'coder' as const }
	];

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
				error = result.error || 'Registration failed';
				return;
			}

			registeredUser = result;
			goto(`/${data.githubUsername}`);
		} catch (e) {
			error = 'Network error. Please try again.';
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>GitYap - Track Your GitHub vs Telegram Activity</title>
	<meta name="description" content="Compare your GitHub commits with Telegram messages. Are you a coder or a yapper?" />
</svelte:head>

<div class="min-h-[calc(100vh-4rem)] flex flex-col">
	<!-- Hero Section -->
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
				Join thousands of developers discovering their coding-chatting balance.
			</p>

			<div class="grid grid-cols-3 gap-4 max-w-2xl mx-auto pt-4">
				{#each quickStats as stat}
					<StatsCard
						value={stat.value}
						label={stat.label}
						icon={stat.icon}
					/>
				{/each}
			</div>
		</div>
	</section>

	<!-- Registration Section -->
	<section class="py-12 px-4">
		<div class="max-w-md mx-auto">
			<div class="rounded-2xl bg-stone-800/50 p-8 border border-stone-700/50
			            shadow-xl shadow-black/10">
				<div class="text-center mb-6">
					<h2 class="text-2xl font-semibold text-stone-200 mb-2">Get Started</h2>
					<p class="text-sm text-stone-400">Enter your details to join GitYap</p>
				</div>

				<RegistrationForm
					onSubmit={handleRegister}
					isLoading={isLoading}
					error={error}
				/>
			</div>
		</div>
	</section>

	<!-- Demo Users Section -->
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
				users={demoUsers}
				totalUsers={demoUsers.length}
				currentPage={1}
				pageSize={4}
			/>
		</div>
	</section>
</div>
