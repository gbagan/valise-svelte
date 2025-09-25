<script lang="ts">
  interface Props {
    text?: string;
    selected?: boolean;
    tooltip?: string | null;
    round?: boolean;
    large?: boolean;
    hidden?: boolean;
    disabled?: boolean;
    style?: string;
    onclick: () => void;
  }
  
  const {text, selected, tooltip, round, large, hidden, disabled, style, onclick}: Props = $props();
</script>

<button
  class={["icon", {selected, round, large, hidden}]}
  disabled={disabled}
  onclick={onclick}
  oncontextmenu={ev => ev.preventDefault()} 
>
  {#if text && text.startsWith("#")}
    <svg style:width="100%" style:height="100%" style={style}>
      <use href={text} class="icon-symbol" />
    </svg>
  {:else if text}
    <span class="icon-text">{text}</span>
  {/if}

  {#if tooltip}
    <span class="tooltip">{tooltip}</span>
  {/if}
</button>

<style>
.icon-symbol {
    opacity: 0.8;
}

.icon {
    line-height: 1.15;
    color: rgba(0, 0, 0, 0.65);

    position: relative;
    width: 3.6rem;
    height: 3.6rem;
    border: thin solid gray;
    display: inline-flex;
    align-items : center;
    justify-content: center;
    cursor: pointer;
    border-radius: 0.7rem;
    opacity: 1;
    transition: opacity 0.3s ease;
    padding: 0.3rem;
    background-color: transparent;
    outline: 0;

    &.round {
        display: flex;
        border-radius: 50%;
    }

    &.selected {
        border: medium solid blue;
    }

    &:disabled {
        cursor: not-allowed;
        .icon-text,.icon-symbol {
            opacity: 0.5;
        }
    }

    &.hidden {
        pointer-events: none;
        opacity: 0;
    }
}

.icon-text {
    text-align: center;
    font-size: 1.5rem;
    font-weight: bold;
}

.tooltip {
    font-weight: normal;
    font-size: 0.9rem;
    background-color: #0000BF;
    color: #fff;
    text-align: center;
    padding: 0.7rem 0.35rem;
    border-radius: 0.4rem;
    width: 9rem;
    position: absolute;
    z-index: 1;
    bottom: 125%;
    left: 50%;
    margin-left: -4.5rem;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease-in 0.1s;

    &::after {
        content: "";
        position: absolute;
        top: 100%;
        left: 50%;
        margin-left: -0.35rem;
        border-width: 0.35rem;
        border-style: solid;
        border-color: #0000BF transparent transparent transparent;
    }
}

.icon:hover .tooltip {
    opacity: 0.8;
}
</style>