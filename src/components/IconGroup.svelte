<script lang="ts">
  interface Props {
      title: string;
      children: any;
  }
  
  const {title, children}: Props = $props();
</script>

<div>
  <div class="text-2xl font-bold mt-4 mb-4">{title}</div>
  <div class="grid grid-cols-5 gap-4">
    {@render children()}
  </div>
</div>