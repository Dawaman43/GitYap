<script lang="ts">
	interface Props {
		photo?: string;
		name?: string;
		size?: 'sm' | 'md' | 'lg';
	}

	let { photo = '', name = '', size = 'md' }: Props = $props();

	const sizeClasses = {
		sm: 'w-8 h-8 text-xs',
		md: 'w-12 h-12 text-sm',
		lg: 'w-16 h-16 text-base'
	};

	const initial = name ? name.charAt(1).toUpperCase() : '?';
</script>

{#if photo}
	<img
		src={photo}
		alt={name || 'Channel'}
		class="rounded-full object-cover {sizeClasses[size]}"
	/>
{:else}
	<div
		class="rounded-full bg-stone-700 flex items-center justify-center font-medium text-stone-300 {sizeClasses[size]}"
	>
		{initial}
	</div>
{/if}
