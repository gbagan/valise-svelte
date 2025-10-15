<script lang="ts" generics="Pos,Move">
  import { type Model, type ScoreModel } from '$lib/model.svelte';
  import Icon from "./Icon.svelte";
  import IconGroup from './IconGroup.svelte';

  interface Props {
    model: Model<Pos, Move> & ScoreModel<Pos>;
  }

  const {model=$bindable()}: Props = $props();

  let bestScore: [number, Pos] | undefined = $derived(model.scores[model.scoreHash() ?? "$custom"]);

  let title = $derived(`Meilleur score (${bestScore ? "" + bestScore[0] : "∅"})`);
</script>

<IconGroup title={title}>
  <Icon
    text="#cup"
    tooltip="Meilleur score"
    disabled={model.locked || !bestScore}
    onclick={() => model.dialog = "score"}
  />
</IconGroup>