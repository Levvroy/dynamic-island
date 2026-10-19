<script lang="ts">
  import { onDestroy } from 'svelte';
  import { NotchStore } from '$lib/notch/store.svelte';
  import { boundsFor, type FeatureId } from '$lib/notch/machine';
  import MediaWidget from './MediaWidget.svelte';
  import SystemWidget from './SystemWidget.svelte';
  import WeatherWidget from './WeatherWidget.svelte';
  import NotificationWidget from './NotificationWidget.svelte';
  import TimerWidget from './TimerWidget.svelte';
  import ClipboardWidget from './ClipboardWidget.svelte';

  const notch = new NotchStore();
  onDestroy(() => notch.destroy());

  const view = $derived(notch.view);
  const size = $derived(boundsFor(view));

  let visible = $state(typeof document === 'undefined' || document.visibilityState === 'visible');
  $effect(() => {
    const onVis = () => (visible = document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  });

  // The clock shows minutes, so wake once per minute boundary instead of every second,
  // and not at all while hidden (KNF-001).
  let now = $state(new Date());
  $effect(() => {
    if (!visible) return;
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      now = new Date();
      t = setTimeout(tick, 60_000 - (Date.now() % 60_000) + 50);
    };
    tick();
    return () => clearTimeout(t);
  });
  const timeStr = $derived(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  // Eyes blink by toggling a class on a sparse timer; no animation runs between blinks (KNF-001).
  let blinking = $state(false);
  $effect(() => {
    if (!visible || view.kind !== 'resting') return;
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      t = setTimeout(() => {
        blinking = true;
        t = setTimeout(() => {
          blinking = false;
          schedule();
        }, 160);
      }, 6000 + Math.random() * 4000);
    };
    schedule();
    return () => {
      clearTimeout(t);
      blinking = false;
    };
  });

  const widgets: { type: FeatureId; icon: string; label: string }[] = [
    { type: 'media', icon: '🎵', label: 'Media' },
    { type: 'timer', icon: '⏱', label: 'Timer' },
    { type: 'system', icon: '⚡', label: 'System' },
    { type: 'weather', icon: '🌸', label: 'Weather' },
    { type: 'notifications', icon: '🔔', label: 'Alerts' },
    { type: 'clipboard', icon: '📋', label: 'Clips' },
  ];

  const ALERT_LABEL: Record<string, string> = {
    charging: 'Charging',
    calendar: 'Jadwal',
    deadline: 'Deadline',
    focus: 'Fokus',
    notification: 'Notifikasi',
    github: 'GitHub',
    reminder: 'Pengingat',
    summary: 'Ringkasan',
  };
</script>

<div
  class="pill"
  class:open={view.kind === 'expanded' || view.kind === 'wide'}
  style="width: {size.width}px; height: {size.height}px;"
  role="region"
  aria-label="Notch"
  onmouseenter={() => notch.hoverEnter()}
  onmouseleave={() => notch.hoverLeave()}
>
  {#if view.kind === 'resting'}
    <div class="row">
      <span class="eyes" class:blink={blinking} aria-hidden="true"><i></i><i></i></span>
      <span class="time">{timeStr}</span>
    </div>
  {:else if view.kind === 'closed'}
    <div class="row">
      <span class="time">{timeStr}</span>
      <span class="wave" aria-label="Musik diputar"><i></i><i></i><i></i><i></i></span>
    </div>
  {:else if view.kind === 'alert'}
    <div class="row alert">
      <span class="alert-kind">{ALERT_LABEL[view.alert.kind]}</span>
      {#if typeof view.alert.payload?.text === 'string'}
        <span class="alert-text">{view.alert.payload.text}</span>
      {/if}
    </div>
  {:else}
    <div class="expanded">
      <div class="tabs">
        {#each widgets as w (w.type)}
          <button
            class="tab"
            class:active={notch.model.selected === w.type}
            onclick={() => notch.dispatch({ type: 'select', feature: w.type })}
          >
            <span>{w.icon}</span><span class="tab-label">{w.label}</span>
          </button>
        {/each}
      </div>
      <div class="widget">
        {#if notch.model.selected === 'media'}
          <MediaWidget />
        {:else if notch.model.selected === 'system'}
          <SystemWidget />
        {:else if notch.model.selected === 'weather'}
          <WeatherWidget />
        {:else if notch.model.selected === 'notifications'}
          <NotificationWidget />
        {:else if notch.model.selected === 'timer'}
          <TimerWidget />
        {:else if notch.model.selected === 'clipboard'}
          <ClipboardWidget />
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .pill {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    border-radius: 0 0 18px 18px;
    background: rgba(10, 10, 20, 0.94);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-top: none;
    overflow: hidden;
    color: #fff;
    /* Duration must stay in sync with SHRINK_DELAY_MS in store.svelte.ts. */
    transition:
      width 0.3s cubic-bezier(0.2, 0.9, 0.3, 1.1),
      height 0.3s cubic-bezier(0.2, 0.9, 0.3, 1.1),
      border-radius 0.3s ease;
  }

  .pill.open {
    border-radius: 0 0 24px 24px;
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100%;
    padding: 0 14px;
    gap: 10px;
  }

  .time {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.4px;
    font-variant-numeric: tabular-nums;
  }

  .eyes {
    display: flex;
    gap: 6px;
  }

  .eyes i {
    width: 7px;
    height: 10px;
    border-radius: 50%;
    background: #9fe8ff;
    transition: transform 0.08s ease;
  }

  .eyes.blink i {
    transform: scaleY(0.1);
  }

  .wave {
    display: flex;
    align-items: center;
    gap: 2px;
    height: 14px;
  }

  .wave i {
    width: 3px;
    height: 100%;
    border-radius: 2px;
    background: #ff6fb5;
    animation: wave 0.9s ease-in-out infinite;
  }

  .wave i:nth-child(2) { animation-delay: -0.2s; }
  .wave i:nth-child(3) { animation-delay: -0.45s; }
  .wave i:nth-child(4) { animation-delay: -0.7s; }

  @keyframes wave {
    0%, 100% { transform: scaleY(0.3); }
    50% { transform: scaleY(1); }
  }

  .alert {
    justify-content: flex-start;
  }

  .alert-kind {
    font-size: 13px;
    font-weight: 700;
  }

  .alert-text {
    font-size: 12px;
    opacity: 0.8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .expanded {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .tabs {
    display: flex;
    gap: 2px;
    padding: 6px 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    flex-shrink: 0;
  }

  .tab {
    display: flex;
    align-items: center;
    gap: 3px;
    padding: 4px 8px;
    border: none;
    border-radius: 12px;
    background: transparent;
    color: rgba(255, 255, 255, 0.55);
    font-size: 11px;
    cursor: pointer;
  }

  .tab:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  .tab.active {
    background: rgba(255, 255, 255, 0.14);
    color: #fff;
  }

  .tab-label {
    font-size: 10px;
  }

  .widget {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    padding: 8px 12px 10px;
  }
</style>
