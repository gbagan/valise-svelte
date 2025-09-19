<script lang="ts" generics="Pos,Move">
  import { type Model, type Methods, type Mode, newGame, computerPlays } from '../../lib/model';
  import Icon from "./Icon.svelte";
  import SelectGroup from "./SelectGroup.svelte";

  interface Props {
    model: Model<Pos>;
    methods: Methods<Pos, Move>;
  }
  
  const {model=$bindable(), methods }: Props = $props();
</script>

<SelectGroup
  title="Mode de jeu"
  values={["random", "expert", "duel"] as Mode[]}
  text={["#school", "#enstein", "#duel"]}
  tooltip={["IA mode facile", "IA mode expert", "Affronte un autre joueur"]}
  selected={model.mode}
  setter={mode => newGame(model, methods, () => model.mode = mode)}
>
  <Icon
    text="2P⇨"
    tooltip="L'IA commence"
    disabled={model.locked}
    onclick={() => computerPlays(model, methods)}
  />
</SelectGroup>