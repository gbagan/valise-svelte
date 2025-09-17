<script lang="ts" generics="Pos,Move">
  import { type Model, type ScoreModel, type Dict, type ScoreDict } from '../../lib/model';
  import Icon from "./Icon.svelte";
  import IconGroup from './IconGroup.svelte';

  interface Props {
    model: Model<Pos> & ScoreModel<Pos>;
    dict: Dict<Pos, Move> & ScoreDict;
  }

  const {model=$bindable(), dict}: Props = $props();

  let bestScore: [number, Pos] | undefined = $derived(model.scores[dict.scoreHash()]);

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