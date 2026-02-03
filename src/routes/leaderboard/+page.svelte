<script lang="ts">
	import SimilarUsersGrid from '$lib/components/SimilarUsersGrid.svelte';
	import SearchBar from '$lib/components/SearchBar.svelte';

	let users = $state<{
		id: string;
		username: string;
		githubUsername: string;
		telegramChannel: string;
		commits: number;
		messages: number;
		score: number;
		badge: 'coder' | 'yapper' | 'balanced';
	}[]>([]);

	let loading = $state(true);
	let currentPage = $state(1);
	let pageSize = $state(12);
	let totalUsers = $state(0);
	let searchQuery = $state('');

	$effect(() => {
		loadUsers();
	});

	async function loadUsers() {
		loading = true;
		try {
			const params = new URLSearchParams({
				page: currentPage.toString(),
				limit: pageSize.toString(),
				...(searchQuery && { search: searchQuery })
			});

			const response = await fetch(`/api/leaderboard?${params}`);
			if (response.ok) {
				const data = await response.json();
				users = data.users;
				totalUsers = data.total;
			}
		} catch (e) {
			console.error('Failed to load users:', e);
		} finally {
			loading = false;
		}
	}

	function handlePageChange(page: number) {
		currentPage = page;
		loadUsers();
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function handleSearch(query: string) {
		searchQuery = query;
		currentPage = 1;
		loadUsers();
	}
</script>

<svelte:head>
	<title>Leaderboard - GitYap</title>
	<meta name="description" content="See who's the top coder or yapper on GitYap" />
</svelte:head>

<div class="min-h-[calc(100vh-4rem)] py-8 px-4">
	<div class="max-w-6xl mx-auto space-y-8">
		<!-- Header -->
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-stone-700/50">
			<div>
				<h1 class="text-3xl font-bold text-stone-100">Leaderboard</h1>
				<p class="text-stone-400 mt-1">Top users ranked by activity</p>
			</div>
			<div class="w-full sm:w-72">
				<SearchBar
					value={searchQuery}
					placeholder="Search users..."
					onsearch={handleSearch}
				/>
			</div>
		</div>

		{#if loading}
			<div class="flex items-center justify-center py-24">
				<div class="flex flex-col items-center gap-4">
					<div class="w-12 h-12 border-4 border-stone-700 border-t-blue-500 rounded-full animate-spin"></div>
					<p class="text-stone-400">Loading leaderboard...</p>
				</div>
			</div>
		{:else}
			<SimilarUsersGrid
				{users}
				{totalUsers}
				{currentPage}
				{pageSize}
				onpagechange={handlePageChange}
				onsearch={handleSearch}
			/>
		{/if}
	</div>
</div>
