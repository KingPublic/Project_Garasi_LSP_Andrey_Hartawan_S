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
	<line x1="12" y1="5" x2="12" y2="19"></line>
	<line x1="5" y1="12" x2="19" y2="12"></line>
</svg>
