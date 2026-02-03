<script lang="ts">
	import { page } from '$app/state';
	import ComparisonChart from '$lib/components/ComparisonChart.svelte';
	import StatsCard from '$lib/components/StatsCard.svelte';
	import UserBadge from '$lib/components/UserBadge.svelte';
	import SimilarUsersGrid from '$lib/components/SimilarUsersGrid.svelte';
	import ChannelAvatar from '$lib/components/ChannelAvatar.svelte';

	const username = $derived(page.params.username);

	let userData = $state<{
		username: string;
		githubUsername: string;
		telegramChannel: string;
		channelPhoto: string;
		githubCommits: number;
		telegramMessages: number;
		ratio: number;
		userType: 'coder' | 'yapper' | 'balanced';
		percentageDifference: string;
	} | null>(null);

	let loading = $state(true);
	let error = $state('');
	let similarUsers = $state<any[]>([]);
	let similarPagination = $state<any>(null);

	$effect(() => {
		if (username) {
			loadUserData();
		}
	});

	async function loadUserData() {
		loading = true;
		error = '';

		try {
			const response = await fetch(`/api/stats/${username}`);
			if (!response.ok) {
				const err = await response.json();
				throw new Error(err.message || 'Failed to load user data');
			}
			userData = await response.json();

			const similarResponse = await fetch(`/api/similars?username=${username}&page=1`);
			if (similarResponse.ok) {
				const data = await similarResponse.json();
				similarUsers = data.users || [];
				similarPagination = data.pagination;
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load user stats. Please try again.';
		} finally {
			loading = false;
		}
	}

	function getBadgeDescription(type: string): string {
		const descriptions: Record<string, string> = {
			coder: 'Prioritizes coding over chatting',
			yapper: 'Loves to chat more than code',
			balanced: 'Perfect harmony between code and chat'
		};
		return descriptions[type] || '';
	}
</script>

<svelte:head>
	<title>{username ? `${username}'s GitYap Stats` : 'User Stats'} - GitYap</title>
</svelte:head>

<div class="min-h-[calc(100vh-4rem)] py-8 px-4">
	<div class="max-w-6xl mx-auto space-y-8">
		{#if loading}
			<div class="flex items-center justify-center py-24">
				<div class="flex flex-col items-center gap-4">
					<div class="w-12 h-12 border-4 border-stone-700 border-t-blue-500 rounded-full animate-spin"></div>
					<p class="text-stone-400">Loading stats...</p>
				</div>
			</div>
		{:else if error}
			<div class="flex items-center justify-center py-24">
				<div class="text-center space-y-4">
					<div class="w-16 h-16 mx-auto rounded-full bg-rose-500/15 flex items-center justify-center text-2xl">
						⚠️
					</div>
					<p class="text-rose-400">{error}</p>
					<button
						onclick={loadUserData}
						class="px-4 py-2 rounded-lg bg-stone-700 hover:bg-stone-600 text-stone-200
						       transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
					>
						Try Again
					</button>
				</div>
			</div>
		{:else if userData}
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-stone-700/50">
				<div class="flex items-center gap-4">
					<ChannelAvatar photo={userData.channelPhoto} name={userData.telegramChannel} size="lg" />
					<div>
						<h1 class="text-3xl font-bold text-stone-100">{userData.githubUsername}</h1>
						<p class="text-stone-400">@{userData.username}</p>
					</div>
				</div>
				<div class="flex flex-col items-start sm:items-end gap-1">
					<UserBadge type={userData.userType} size="lg" />
					<span class="text-xs text-stone-500">{getBadgeDescription(userData.userType)}</span>
				</div>
			</div>

			<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
				<StatsCard
					value={userData.githubCommits.toLocaleString()}
					label="GitHub Commits"
					icon="💻"
					trend={userData.githubCommits > userData.telegramMessages ? 'up' : 'neutral'}
				/>
				<StatsCard
					value={userData.telegramMessages.toLocaleString()}
					label="Telegram Messages"
					icon="💬"
					trend={userData.telegramMessages > userData.githubCommits ? 'up' : 'neutral'}
				/>
				<StatsCard
					value={userData.percentageDifference}
					label="Yap Ratio"
					icon="⚖️"
				/>
				<StatsCard
					value={userData.githubCommits + userData.telegramMessages}
					label="Total Activity"
					icon="📊"
				/>
			</div>

			<ComparisonChart commits={userData.githubCommits} messages={userData.telegramMessages} />

			{#if similarUsers.length > 0}
				<div class="pt-8 border-t border-stone-700/50">
					<h2 class="text-2xl font-semibold text-stone-200 mb-6">Similar Users</h2>
					<SimilarUsersGrid
						users={similarUsers}
						totalUsers={similarPagination?.totalCount || similarUsers.length}
						currentPage={1}
						pageSize={4}
					/>
				</div>
			{/if}
		{:else}
			<div class="flex items-center justify-center py-24">
				<p class="text-stone-400">User not found</p>
			</div>
		{/if}
	</div>
</div>
