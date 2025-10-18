<script lang="ts" generics="Pos,Move">
  import { type Model, Mode } from '$lib/model.svelte';
  import Icon from "./Icon.svelte";
  import SelectGroup from "./SelectGroup.svelte";

  interface Props {
    model: Model<Pos, Move>;
  }
  
  const {model=$bindable() }: Props = $props();

  const onclickHandler = () => {
    model.computerStarts = true;
    model.computerPlays();
  };
</script>

<SelectGroup
  title="Mode de jeu"
  values={[Mode.Random, Mode.Expert, Mode.Duel]}
  text={["#school", "#enstein", "#duel"]}
  tooltip={["IA mode facile", "IA mode expert", "Affronte un autre joueur"]}
  selected={model.mode}
  disabled={model.locked}
  setter={mode => model.newGame(() => model.mode = mode)}
>
  <Icon
    text="2P⇨"
    tooltip="L'IA commence"
    disabled={model.locked || model.computerStarts || model.mode === Mode.Duel || !model.isHistoryEmpty()}
    onclick={onclickHandler}
  />
</SelectGroup>