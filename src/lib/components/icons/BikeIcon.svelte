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
	<circle cx="18.5" cy="17.5" r="3.5"></circle>
	<circle cx="5.5" cy="17.5" r="3.5"></circle>
	<circle cx="15" cy="5" r="1"></circle>
	<path d="M12 17.5V14l-3-3 4-3 2 3h2"></path>
</svg>
