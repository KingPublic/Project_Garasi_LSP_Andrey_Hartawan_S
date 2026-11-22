<script lang="ts">
	interface Props {
		size?: number | string;
		class?: string;
		strokeWidth?: number | string;
	}
	let { size = 20, class: className = '', strokeWidth = 2 }: Props = $props();
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width={strokeWidth}
	stroke-linecap="round"
	stroke-linejoin="round"
	class={className}
>
	<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
	<polyline points="16 17 21 12 16 7"></polyline>
	<line x1="21" y1="12" x2="9" y2="12"></line>
</svg>
