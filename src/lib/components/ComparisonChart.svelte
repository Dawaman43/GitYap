<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Chart from 'chart.js/auto';

	interface Props {
		commits: number;
		messages: number;
	}

	let { commits, messages }: Props = $props();

	let canvasRef: HTMLCanvasElement | undefined = $state();
	let chart: Chart | null = $state(null);

	const mutedColors = {
		commits: 'hsl(210, 40%, 55%)',
		commitsBg: 'hsl(210, 40%, 55%, 0.7)',
		messages: 'hsl(35, 50%, 55%)',
		messagesBg: 'hsl(35, 50%, 55%, 0.7)',
		grid: 'hsl(30, 10%, 25%)',
		text: 'hsl(30, 10%, 65%)'
	};

	onMount(() => {
		if (!canvasRef) return;

		chart = new Chart(canvasRef, {
			type: 'bar',
			data: {
				labels: ['GitHub Commits', 'Telegram Messages'],
				datasets: [{
					label: 'Activity',
					data: [commits, messages],
					backgroundColor: [mutedColors.commitsBg, mutedColors.messagesBg],
					borderColor: [mutedColors.commits, mutedColors.messages],
					borderWidth: 2,
					borderRadius: 8,
					borderSkipped: false
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: false
					},
					tooltip: {
						backgroundColor: 'hsl(30, 10%, 15%)',
						titleColor: 'hsl(30, 10%, 90%)',
						bodyColor: 'hsl(30, 10%, 80%)',
						borderColor: 'hsl(30, 10%, 25%)',
						borderWidth: 1,
						cornerRadius: 8,
						padding: 12,
						displayColors: false
					}
				},
				scales: {
					x: {
						grid: {
							display: false
						},
						ticks: {
							color: mutedColors.text,
							font: {
								size: 12,
								weight: 'bold'
							}
						}
					},
					y: {
						grid: {
							color: mutedColors.grid
						},
						ticks: {
							color: mutedColors.text,
							font: {
								size: 11
							}
						},
						border: {
							display: false
						}
					}
				},
				animation: {
					duration: 800,
					easing: 'easeOutQuart'
				}
			}
		});
	});

	onDestroy(() => {
		if (chart) {
			chart.destroy();
		}
	});

	$effect(() => {
		if (chart) {
			chart.data.datasets[0].data = [commits, messages];
			chart.update('active');
		}
	});
</script>

<div class="relative w-full h-64 rounded-xl bg-stone-800/50 p-6 border border-stone-700/50
            transition-all duration-200 ease-[cubic-bezier(0.4,0.0,0.2,1)]
            hover:border-stone-600/50">
	<div class="flex items-center justify-between mb-4">
		<h3 class="text-lg font-semibold text-stone-200">Activity Comparison</h3>
		<div class="flex items-center gap-4 text-sm">
			<div class="flex items-center gap-2">
				<div class="w-3 h-3 rounded-full" style="background-color: {mutedColors.commits}"></div>
				<span class="text-stone-400">Commits</span>
			</div>
			<div class="flex items-center gap-2">
				<div class="w-3 h-3 rounded-full" style="background-color: {mutedColors.messages}"></div>
				<span class="text-stone-400">Messages</span>
			</div>
		</div>
	</div>
	<div class="relative h-48">
		<canvas bind:this={canvasRef}></canvas>
	</div>
</div>
