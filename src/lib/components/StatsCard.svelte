<script lang="ts">
	interface Props {
		value: number | string;
		label: string;
		icon?: string;
		subtext?: string;
		trend?: 'up' | 'down' | 'neutral';
	}

	let { value, label, icon = '', subtext = '', trend = 'neutral' }: Props = $props();

	const trendColors = {
		up: 'text-emerald-400',
		down: 'text-rose-400',
		neutral: 'text-stone-400'
	};

	const trendIcons = {
		up: '↗',
		down: '↘',
		neutral: '→'
	};
</script>

<div
	class="group relative overflow-hidden rounded-xl bg-stone-800/50 p-6 border border-stone-700/50
	       transition-all duration-200 ease-[cubic-bezier(0.4,0.0,0.2,1)]
	       hover:scale-[1.02] hover:border-stone-600/50 hover:bg-stone-800/70
	       active:scale-[0.98]"
>
	<div class="flex items-start justify-between">
		<div class="flex flex-col gap-1">
			<span class="text-sm font-medium text-stone-400">{label}</span>
			<div class="flex items-baseline gap-2">
				<span class="text-3xl font-bold text-stone-100">{value}</span>
				{#if trend !== 'neutral'}
					<span class="text-sm {trendColors[trend]} transition-transform duration-200 group-hover:translate-x-0.5">
						{trendIcons[trend]}
					</span>
				{/if}
			</div>
			{#if subtext}
				<span class="text-xs text-stone-500">{subtext}</span>
			{/if}
		</div>
		{#if icon}
			<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-stone-700/50 text-xl text-stone-300
			            transition-all duration-200 group-hover:bg-stone-600/50 group-hover:text-stone-200">
				{icon}
			</div>
		{/if}
	</div>

	<div class="absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-stone-700/10 to-transparent opacity-0
	            transition-opacity duration-200 group-hover:opacity-100"></div>
</div>
