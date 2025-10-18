<script lang="ts" generics="Pos,Move">
  import { type Model, type ScoreModel } from '$lib/model.svelte';
  import Icon from "./Icon.svelte";
  import IconGroup from './IconGroup.svelte';

  interface Props {
    model: Model<Pos, Move> & ScoreModel<Pos>;
  }

  const {model=$bindable()}: Props = $props();

  let bestScore: number | null = $derived(model.bestScore());
  let title = $derived(`Meilleur score (${bestScore ?? "∅"})`);
</script>

<IconGroup title={title}>
  <Icon
    text="#cup"
    tooltip="Meilleur score"
    disabled={model.locked || bestScore === null}
    onclick={() => model.dialog = "score"}
  />
</IconGroup>