<script lang="ts">
	interface Props {
		currentPage: number;
		totalPages: number;
		onpagechange?: (page: number) => void;
	}

	let { currentPage, totalPages, onpagechange }: Props = $props();

	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages && onpagechange) {
			onpagechange(page);
		}
	}

	function getPageNumbers(): (number | string)[] {
		const pages: (number | string)[] = [];
		const maxVisible = 5;

		if (totalPages <= maxVisible) {
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			if (currentPage <= 3) {
				for (let i = 1; i <= 4; i++) pages.push(i);
				pages.push('...');
				pages.push(totalPages);
			} else if (currentPage >= totalPages - 2) {
				pages.push(1);
				pages.push('...');
				for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
			} else {
				pages.push(1);
				pages.push('...');
				pages.push(currentPage - 1);
				pages.push(currentPage);
				pages.push(currentPage + 1);
				pages.push('...');
				pages.push(totalPages);
			}
		}

		return pages;
	}
</script>

<nav class="flex items-center gap-2" aria-label="Pagination">
	<button
		onclick={() => goToPage(currentPage - 1)}
		disabled={currentPage <= 1}
		class="flex items-center gap-1 px-3 py-2 rounded-lg bg-stone-800/50 border border-stone-700/50
		       text-stone-300 text-sm font-medium
		       transition-all duration-200 ease-[cubic-bezier(0.4,0.0,0.2,1)]
		       hover:bg-stone-700/50 hover:border-stone-600/50 hover:scale-[1.02]
		       active:scale-[0.98]
		       disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
	>
		<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
		</svg>
		<span class="hidden sm:inline">Previous</span>
	</button>

	<div class="flex items-center gap-1">
		{#each getPageNumbers() as page}
			{#if page === '...'}
				<span class="px-2 text-stone-500">...</span>
			{:else}
				<button
					onclick={() => goToPage(page as number)}
					class="min-w-[40px] px-3 py-2 rounded-lg text-sm font-medium
					       transition-all duration-200 ease-[cubic-bezier(0.4,0.0,0.2,1)]
					       {currentPage === page
							? 'bg-stone-600 text-stone-100 border border-stone-500'
							: 'bg-stone-800/50 text-stone-400 border border-stone-700/50 hover:bg-stone-700/50 hover:border-stone-600/50 hover:text-stone-200 hover:scale-[1.02] active:scale-[0.98]'}">
					{page}
				</button>
			{/if}
		{/each}
	</div>

	<button
		onclick={() => goToPage(currentPage + 1)}
		disabled={currentPage >= totalPages}
		class="flex items-center gap-1 px-3 py-2 rounded-lg bg-stone-800/50 border border-stone-700/50
		       text-stone-300 text-sm font-medium
		       transition-all duration-200 ease-[cubic-bezier(0.4,0.0,0.2,1)]
		       hover:bg-stone-700/50 hover:border-stone-600/50 hover:scale-[1.02]
		       active:scale-[0.98]
		       disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
	>
		<span class="hidden sm:inline">Next</span>
		<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
		</svg>
	</button>
</nav>
