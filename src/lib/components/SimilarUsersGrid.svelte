<script lang="ts">
	import SearchBar from './SearchBar.svelte';
	import Pagination from './Pagination.svelte';
	import UserBadge from './UserBadge.svelte';

	interface User {
		username: string;
		githubCommits: number;
		telegramMessages: number;
		ratio: number;
		ratioDifference?: number;
	}

	interface Props {
		users: User[];
		totalUsers: number;
		currentPage?: number;
		pageSize?: number;
		onpagechange?: (page: number) => void;
		onsearch?: (query: string) => void;
	}

	let {
		users,
		totalUsers,
		currentPage = 1,
		pageSize = 12,
		onpagechange,
		onsearch
	}: Props = $props();

	let searchQuery = $state('');

	const totalPages = $derived(Math.ceil(totalUsers / pageSize));

	function getBadge(ratio: number): 'coder' | 'yapper' | 'balanced' {
		if (ratio < 0.5) return 'coder';
		if (ratio > 2) return 'yapper';
		return 'balanced';
	}

	function handleSearch(query: string) {
		searchQuery = query;
		if (onsearch) {
			onsearch(query);
		}
	}
</script>

<div class="space-y-6">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div class="flex-1 max-w-md">
			<SearchBar
				value={searchQuery}
				placeholder="Search users..."
				onsearch={handleSearch}
			/>
		</div>
		<span class="text-sm text-stone-400">
			Showing {users.length} of {totalUsers} users
		</span>
	</div>

	{#if users.length === 0}
		<div class="flex flex-col items-center justify-center py-16 rounded-xl bg-stone-800/30 border border-stone-700/30">
			<div class="w-16 h-16 mb-4 rounded-full bg-stone-700/50 flex items-center justify-center text-3xl">
				🔍
			</div>
			<p class="text-stone-400 text-lg">No users found</p>
			<p class="text-stone-500 text-sm mt-1">Try adjusting your search</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
			{#each users as user}
				<a
					href="/{user.username}"
					class="group relative overflow-hidden rounded-xl bg-stone-800/50 p-5
					       border border-stone-700/50
					       transition-all duration-200 ease-[cubic-bezier(0.4,0.0,0.2,1)]
					       hover:scale-[1.02] hover:border-stone-600/50 hover:bg-stone-800/70
					       active:scale-[0.98]"
				>
					<div class="flex items-start justify-between mb-3">
						<div class="flex items-center gap-3">
							<div class="w-10 h-10 rounded-lg bg-stone-700/50 flex items-center justify-center
							            text-lg transition-all duration-200 group-hover:bg-stone-600/50">
								👤
							</div>
							<div>
								<h4 class="font-semibold text-stone-200 group-hover:text-stone-100
								           transition-colors duration-200">
									{user.username}
								</h4>
								<p class="text-xs text-stone-500">@{user.username}</p>
							</div>
						</div>
						<UserBadge type={getBadge(user.ratio)} size="sm" />
					</div>

					<div class="grid grid-cols-2 gap-3 pt-3 border-t border-stone-700/30">
						<div class="flex flex-col">
							<span class="text-xs text-stone-500">Commits</span>
							<span class="text-lg font-semibold text-stone-300">{user.githubCommits.toLocaleString()}</span>
						</div>
						<div class="flex flex-col">
							<span class="text-xs text-stone-500">Messages</span>
							<span class="text-lg font-semibold text-stone-300">{user.telegramMessages.toLocaleString()}</span>
						</div>
					</div>

					<div class="mt-3 pt-3 border-t border-stone-700/30">
						<div class="flex items-center justify-between">
							<span class="text-xs text-stone-500">Ratio</span>
							<span class="text-sm font-semibold text-stone-200">{user.ratio.toFixed(2)}</span>
						</div>
					</div>

					<div class="absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-stone-700/10 to-transparent
					            opacity-0 transition-opacity duration-200 group-hover:opacity-100"></div>
				</a>
			{/each}
		</div>

		{#if totalPages > 1}
			<div class="flex justify-center pt-4">
				<Pagination
					currentPage={currentPage}
					{totalPages}
					onpagechange={onpagechange}
				/>
			</div>
		{/if}
	{/if}
</div>
