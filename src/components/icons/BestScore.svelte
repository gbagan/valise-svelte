<script lang="ts" generics="Pos,Move">
  import { type Model, type ScoreModel, type Methods, type ScoreMethods } from '../../lib/model';
  import Icon from "./Icon.svelte";
  import IconGroup from './IconGroup.svelte';

  interface Props {
    model: Model<Pos> & ScoreModel<Pos>;
    methods: Methods<Pos, Move> & ScoreMethods;
  }

  const {model=$bindable(), methods}: Props = $props();

  let bestScore: [number, Pos] | undefined = $derived(model.scores[methods.scoreHash() ?? "$custom"]);

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