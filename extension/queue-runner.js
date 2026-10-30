const QueueRunner = (() => {
  const JITTER_RATIO = 0.3;
  const RETRY_DELAY_FACTOR = 3;

  const Status = {
    PENDING: "pending",
    WORKING: "working",
    WAITING: "waiting",
    RESOLVED: "resolved",
    NO_MATCH: "no match",
    SAVED: "saved",
    FAILED: "failed",
  };

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function waitWithJitter(seconds) {
    const base = seconds * 1000;
    const jitter = base * JITTER_RATIO * (Math.random() * 2 - 1);
    return sleep(Math.max(1000, base + jitter));
  }

  async function withRetry(task, seconds) {
    try {
      return await task();
    } catch {
      await waitWithJitter(seconds * RETRY_DELAY_FACTOR);
      return task();
    }
  }

  function normalize(text) {
    return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toLowerCase();
  }

  function pickMatch(item, results) {
    const wanted = [item.query, item.name, ...(item.aliases ?? [])].filter(Boolean).map(normalize);
    return results.find((r) => wanted.includes(normalize(r.name))) ?? null;
  }

  function validateQueue(queue) {
    if (!queue?.profile?.vanityName || !queue?.profile?.profileId) throw new Error("Queue needs profile.vanityName and profile.profileId.");
    if (!Array.isArray(queue.skills)) throw new Error("Queue needs a skills array.");
    for (const skill of queue.skills) {
      const unknown = skill.positions.filter((p) => !queue.positions[p]);
      if (unknown.length) throw new Error(`${skill.name}: unknown positions ${unknown.join(", ")}`);
    }
  }

  function setStatus(item, status, detail, onUpdate) {
    item.status = status;
    item.detail = detail ?? "";
    onUpdate();
  }

  async function runSequentially(items, seconds, onUpdate, shouldStop, step) {
    for (const [index, item] of items.entries()) {
      if (shouldStop()) return;
      if (index > 0) {
        setStatus(item, Status.WAITING, `~${seconds}s`, onUpdate);
        await waitWithJitter(seconds);
        if (shouldStop()) return setStatus(item, Status.PENDING, "", onUpdate);
      }
      setStatus(item, Status.WORKING, "", onUpdate);
      try {
        await step(item);
      } catch (error) {
        setStatus(item, Status.FAILED, error.message, onUpdate);
      }
    }
  }

  function resolveAll(items, seconds, onUpdate, shouldStop) {
    const pending = items.filter((item) => item.enabled && !item.selected);
    return runSequentially(pending, seconds, onUpdate, shouldStop, async (item) => {
      item.results = await withRetry(() => LinkedInSkillsApi.searchSkills(item.query ?? item.name), seconds);
      item.selected = pickMatch(item, item.results);
      const status = item.selected ? Status.RESOLVED : Status.NO_MATCH;
      setStatus(item, status, item.results.length ? "" : "LinkedIn returned no results", onUpdate);
    });
  }

  function saveAll(queue, items, seconds, onUpdate, shouldStop) {
    let totalSkills = queue.profile.totalSkills ?? 0;
    const pending = items.filter((item) => item.enabled && item.selected && item.status !== Status.SAVED);
    return runSequentially(pending, seconds, onUpdate, shouldStop, async (item) => {
      const isEdit = item.mode === "edit";
      await LinkedInSkillsApi.saveSkill({
        profile: { ...queue.profile, totalSkills },
        skill: item.selected,
        positionIds: item.positions.map((p) => queue.positions[p].id),
        isEdit,
      });
      if (!isEdit) totalSkills += 1;
      setStatus(item, Status.SAVED, "", onUpdate);
    });
  }

  return { Status, validateQueue, resolveAll, saveAll };
})();
