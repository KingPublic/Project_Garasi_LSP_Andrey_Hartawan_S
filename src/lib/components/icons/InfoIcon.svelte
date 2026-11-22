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
	<circle cx="12" cy="12" r="10"></circle>
	<line x1="12" y1="16" x2="12" y2="12"></line>
	<line x1="12" y1="8" x2="12.01" y2="8"></line>
</svg>
