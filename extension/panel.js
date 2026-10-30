(() => {
  const DEFAULT_DELAY_SECONDS = 8;
  const STYLE = `
    :host { all: initial; }
    .panel { position: fixed; top: 64px; right: 16px; width: 520px; max-height: 80vh; overflow: auto; z-index: 2147483647;
      background: #fff; color: #1d2226; border: 1px solid #c8c8c8; border-radius: 8px; padding: 12px;
      font: 13px/1.4 system-ui, sans-serif; box-shadow: 0 4px 16px rgba(0,0,0,.2); }
    h2 { font-size: 15px; margin: 0 0 8px; }
    textarea { width: 100%; height: 80px; font: 12px monospace; box-sizing: border-box; }
    .controls { display: flex; gap: 8px; align-items: center; margin: 8px 0; flex-wrap: wrap; }
    input[type=number] { width: 56px; }
    table { width: 100%; border-collapse: collapse; }
    td, th { border-top: 1px solid #eee; padding: 4px; text-align: left; vertical-align: top; }
    select { max-width: 160px; }
    .muted { color: #666; font-size: 11px; }
    .ok { color: #057642; } .bad { color: #b24020; } .busy { color: #0a66c2; }
    .progress { margin: 4px 0 8px; font-weight: 600; }
  `;

  let root = null;
  let queue = null;
  let items = [];
  let stopRequested = false;

  function element(tag, props = {}, children = []) {
    const node = Object.assign(document.createElement(tag), props);
    node.append(...children);
    return node;
  }

  function delaySeconds() {
    return Math.max(2, Number(root.getElementById("delay").value) || DEFAULT_DELAY_SECONDS);
  }

  const STATUS_VIEW = {
    [QueueRunner.Status.PENDING]: ["·", "pending", ""],
    [QueueRunner.Status.WORKING]: ["⏳", "working…", "busy"],
    [QueueRunner.Status.WAITING]: ["⏱", "waiting", "busy"],
    [QueueRunner.Status.RESOLVED]: ["●", "ready to save", "busy"],
    [QueueRunner.Status.NO_MATCH]: ["?", "pick a match", "bad"],
    [QueueRunner.Status.SAVED]: ["✓", "saved", "ok"],
    [QueueRunner.Status.FAILED]: ["✗", "failed", "bad"],
  };

  function statusCell(item) {
    const [icon, label, className] = STATUS_VIEW[item.status];
    const text = item.detail ? `${icon} ${label}: ${item.detail}` : `${icon} ${label}`;
    return element("td", { className, textContent: text });
  }

  function progressText() {
    const enabled = items.filter((i) => i.enabled);
    const resolved = enabled.filter((i) => i.selected).length;
    const saved = enabled.filter((i) => i.status === QueueRunner.Status.SAVED).length;
    return `Resolved ${resolved}/${enabled.length} · Saved ${saved}/${enabled.length}`;
  }

  function matchSelect(item) {
    const select = element("select", { disabled: !item.results?.length });
    select.append(element("option", { value: "", textContent: item.results ? "(none)" : "-" }));
    for (const result of item.results ?? []) {
      const option = element("option", { value: result.id, textContent: `${result.name} (${result.id})` });
      option.selected = item.selected?.id === result.id;
      select.append(option);
    }
    select.onchange = () => {
      item.selected = item.results.find((r) => r.id === select.value) ?? null;
      item.status = item.selected ? QueueRunner.Status.RESOLVED : QueueRunner.Status.NO_MATCH;
      item.detail = "";
      renderItems();
    };
    return select;
  }

  function itemRow(item) {
    const checkbox = element("input", { type: "checkbox", checked: item.enabled });
    checkbox.onchange = () => {
      item.enabled = checkbox.checked;
      renderProgress();
    };
    const labels = item.positions.map((p) => queue.positions[p].label).join("; ");
    return element("tr", {}, [
      element("td", {}, [checkbox]),
      element("td", {}, [item.name, element("div", { className: "muted", textContent: `${item.mode}: ${labels}` })]),
      element("td", {}, [matchSelect(item)]),
      statusCell(item),
    ]);
  }

  function renderProgress() {
    root.getElementById("progress").textContent = queue ? progressText() : "";
  }

  function renderItems() {
    root.getElementById("rows").replaceChildren(...items.map(itemRow));
    renderProgress();
  }

  function setBusy(busy) {
    for (const id of ["load", "resolve", "save"]) root.getElementById(id).disabled = busy;
    root.getElementById("stop").disabled = !busy;
  }

  function loadQueue() {
    try {
      queue = JSON.parse(root.getElementById("queue").value);
      QueueRunner.validateQueue(queue);
      items = queue.skills.map((skill) => ({ ...skill, enabled: true, status: QueueRunner.Status.PENDING, detail: "" }));
      renderItems();
    } catch (error) {
      alert(`Invalid queue: ${error.message}`);
    }
  }

  async function run(task) {
    if (!queue) return alert("Load a queue first.");
    stopRequested = false;
    setBusy(true);
    try {
      await task(delaySeconds(), renderItems, () => stopRequested);
    } finally {
      setBusy(false);
    }
  }

  function confirmSave() {
    const count = items.filter((i) => i.enabled && i.selected && i.status !== QueueRunner.Status.SAVED).length;
    return count > 0 && confirm(`Save ${count} skill(s) to your profile, one every ~${delaySeconds()}s? Nothing is posted to your feed.`);
  }

  function build() {
    const host = element("div");
    root = host.attachShadow({ mode: "open" });
    root.append(
      element("style", { textContent: STYLE }),
      element("div", { className: "panel" }, [
        element("h2", { textContent: "career-sync: LinkedIn skills" }),
        element("textarea", { id: "queue", placeholder: "Paste linkedin-skills-queue.json" }),
        element("div", { className: "controls" }, [
          element("button", { id: "load", textContent: "Load" }),
          element("button", { id: "resolve", textContent: "1. Resolve" }),
          element("button", { id: "save", textContent: "2. Save checked" }),
          element("button", { id: "stop", textContent: "Stop", disabled: true }),
          element("label", { textContent: "Seconds between requests " }, [
            element("input", { id: "delay", type: "number", min: 2, value: DEFAULT_DELAY_SECONDS }),
          ]),
        ]),
        element("div", { id: "progress", className: "progress" }),
        element("table", {}, [
          element("thead", {}, [element("tr", {}, ["", "Skill", "LinkedIn match", "Status"].map((t) => element("th", { textContent: t })))]),
          element("tbody", { id: "rows" }),
        ]),
      ]),
    );
    root.getElementById("load").onclick = loadQueue;
    root.getElementById("resolve").onclick = () => run((s, u, stop) => QueueRunner.resolveAll(items.filter((i) => i.enabled), s, u, stop));
    root.getElementById("save").onclick = () => confirmSave() && run((s, u, stop) => QueueRunner.saveAll(queue, items, s, u, stop));
    root.getElementById("stop").onclick = () => { stopRequested = true; };
    document.body.append(host);
    return host;
  }

  let host = null;
  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type !== "career-sync:toggle") return;
    if (!host) {
      host = build();
      return;
    }
    host.hidden = !host.hidden;
  });
})();
