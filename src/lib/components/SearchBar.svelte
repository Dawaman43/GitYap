<script lang="ts">
	interface Props {
		value: string;
		placeholder?: string;
		onsearch?: (query: string) => void;
	}

	let { value = $bindable(''), placeholder = 'Search...', onsearch }: Props = $props();

	let inputRef: HTMLInputElement | undefined = $state();

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' && onsearch) {
			onsearch(value);
		}
	}

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		value = target.value;
		if (onsearch) {
			onsearch(value);
		}
	}
</script>

<div class="relative group">
	<div class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
		<svg class="w-5 h-5 text-stone-500 transition-colors duration-200 group-focus-within:text-stone-300"
		     fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
			      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
		</svg>
	</div>

	<input
		bind:this={inputRef}
		type="text"
		{value}
		{placeholder}
		oninput={handleInput}
		onkeydown={handleKeyDown}
		class="w-full pl-12 pr-4 py-3 rounded-xl bg-stone-800/50 border border-stone-700/50
		       text-stone-100 placeholder:text-stone-500
		       transition-all duration-200 ease-[cubic-bezier(0.4,0.0,0.2,1)]
		       focus:outline-none focus:border-stone-500 focus:bg-stone-800/70
		       hover:border-stone-600/50"
	/>

	{#if value}
		<button
			onclick={() => { value = ''; if (onsearch) onsearch(''); inputRef?.focus(); }}
			class="absolute inset-y-0 right-0 flex items-center pr-4 text-stone-500
			       transition-all duration-200 hover:text-stone-300 hover:scale-110 active:scale-95"
			type="button"
			aria-label="Clear search"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
			</svg>
		</button>
	{/if}
</div>
