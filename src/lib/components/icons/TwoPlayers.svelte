<script lang="ts" generics="Position,Move">
  import { type Model } from '$lib/model.svelte';
  import { Mode, type TwoPlayersModel } from '$lib/twoplayers.svelte';
  import Icon from "./Icon.svelte";
  import SelectGroup from "./SelectGroup.svelte";

  interface Props {
    model: Model<Position, Move> & TwoPlayersModel;
  }
  
  const {model=$bindable() }: Props = $props();
</script>

<SelectGroup
  title="Mode de jeu"
  values={[Mode.Random, Mode.Expert, Mode.Duel]}
  text={["#school", "#enstein", "#duel"]}
  tooltip={["IA mode facile", "IA mode expert", "Affronte un autre joueur"]}
  selected={model.mode}
  disabled={model.locked}
  setter={model.setMode}
>
  <Icon
    text="2P⇨"
    tooltip="L'IA commence"
    disabled={model.locked || model.didMachineStart || model.mode === Mode.Duel || !model.isHistoryEmpty()}
    onclick={model.machineStarts}
  />
</SelectGroup>