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
	<line x1="15" y1="9" x2="9" y2="15"></line>
	<line x1="9" y1="9" x2="15" y2="15"></line>
</svg>
