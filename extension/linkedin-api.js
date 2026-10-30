const LinkedInSkillsApi = (() => {
  const ENDPOINT = "/flagship-web/rsc-action/actions/server-request";
  const NAMESPACE = "MemoryNamespace";
  const TYPEAHEAD_ID = "PROFILE_ADD_SKILLS_FORM_TYPEAHEAD_REQUEST";
  const SAVE_ID = "com.linkedin.sdui.requests.profile.saveProfileSkillForm";
  const ASSOCIATION_KINDS = [
    "Experience", "Education", "Certification", "Project", "Publication",
    "Course", "Honor", "Volunteer", "Organization", "Patent",
  ];

  function csrfToken() {
    const match = document.cookie.match(/JSESSIONID="?([^";]+)"?/);
    if (!match) throw new Error("No JSESSIONID cookie. Log in to LinkedIn in this tab.");
    return match[1];
  }

  function stateKey(id) {
    return { key: { value: { $case: "id", id } } };
  }

  function binding(key) {
    return { key, namespace: NAMESPACE };
  }

  function state(key, value, protoCase) {
    return {
      key,
      namespace: NAMESPACE,
      value,
      originalProtoCase: protoCase,
      protoKey: { $type: "proto.sdui.Key", value: { $case: "id", id: key } },
    };
  }

  function formKeys(formId) {
    const keys = {
      skillName: `addSkillsTypeaheadSkillName${formId}`,
      skillId: `addSkillsTypeaheadSkillId${formId}`,
      showAssociation: `addSkillsShowSkillsAssociation${formId}`,
      followToKeepUp: `skillsFollowToKeepUp${formId}`,
    };
    for (const kind of ASSOCIATION_KINDS) keys[`association${kind}`] = `skillAssociations${kind}${formId}`;
    return keys;
  }

  function serverRequestBody(requestId, payload, states, screenId) {
    const requestedArguments = {
      $type: "proto.sdui.actions.requests.RequestedArguments",
      requestedStateKeys: states.map((s) => stateKey(s.key)),
      payload,
      requestMetadata: { $type: "proto.sdui.common.RequestMetadata" },
    };
    return {
      requestId,
      serverRequest: { requestId, requestedArguments, isApfcEnabled: false, isStreaming: false, rumPageKey: "" },
      states,
      requestedArguments: { ...requestedArguments, states, screenId, knownTemplateIds: [] },
    };
  }

  async function post(requestId, body) {
    const url = `${ENDPOINT}?sduiid=${encodeURIComponent(requestId)}`;
    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        "csrf-token": csrfToken(),
        "x-li-rsc-stream": "true",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.text();
  }

  function rootRecord(rscText) {
    const line = rscText.split("\n").find((l) => l.startsWith("0:"));
    return line ? JSON.parse(line.slice(2)) : null;
  }

  function unescapeJsonString(raw) {
    return JSON.parse(`"${raw}"`);
  }

  function parseTypeaheadResults(rscText, keys) {
    const value = '"\\}\\}\\},"value":\\{"\\$case":"stringValue","stringValue":"((?:[^"\\\\]|\\\\.)*)"';
    const pattern = new RegExp(`${keys.skillName}${value}[\\s\\S]{0,400}?${keys.skillId}${value}`, "g");
    const results = [];
    for (const match of rscText.matchAll(pattern)) {
      const name = unescapeJsonString(match[1]);
      const id = unescapeJsonString(match[2]);
      if (id && !results.some((r) => r.id === id)) results.push({ name, id });
    }
    return results;
  }

  async function searchSkills(keywords) {
    const keys = formKeys(crypto.randomUUID());
    const states = [
      state(keys.skillName, keywords, "stringValue"),
      state(keys.skillId, "", "stringValue"),
      state(keys.showAssociation, true, "booleanValue"),
    ];
    const payload = {
      keywords: binding(keys.skillName),
      resultsComponentRef: `auto-component-${crypto.randomUUID()}_TypeaheadResults`,
      errorContainerRef: `auto-binding-${crypto.randomUUID()}`,
      idBinding: binding(keys.skillId),
      associationDisplayBinding: binding(keys.showAssociation),
    };
    const body = serverRequestBody(TYPEAHEAD_ID, payload, states, "com.linkedin.sdui.flagshipnav.profile.ProfileSkillAddForm");
    return parseTypeaheadResults(await post(TYPEAHEAD_ID, body), keys);
  }

  function formFlagBindings() {
    return {
      hasChanges: binding(`auto-binding-${crypto.randomUUID()}isActiveProfileFormHasChanges`),
      showLoader: binding(`auto-binding-${crypto.randomUUID()}isActiveProfileFormLoading`),
      userExitedForm: binding(`auto-binding-${crypto.randomUUID()}profileFormUserExitedForm`),
      saveOrDeleteRequestPending: binding(`auto-binding-${crypto.randomUUID()}profileFormSaveOrDeleteRequestPending`),
    };
  }

  function saveStates(keys, skill, positionIds) {
    return [
      state(keys.skillName, skill.name, "stringValue"),
      state(keys.skillId, skill.id, "stringValue"),
      ...ASSOCIATION_KINDS.map((kind) =>
        state(keys[`association${kind}`], kind === "Experience" ? positionIds : [], "stringListValue")),
      state(keys.followToKeepUp, false, "booleanValue"),
    ];
  }

  function savePayload(keys, profile, isEdit) {
    const associations = Object.fromEntries(ASSOCIATION_KINDS.map((kind) =>
      [`${kind.toLowerCase()}Associations`, binding(keys[`association${kind}`])]));
    return {
      skillName: binding(keys.skillName),
      skillId: binding(keys.skillId),
      ...associations,
      followToKeepUp: binding(keys.followToKeepUp),
      isEdit,
      vanityName: profile.vanityName,
      profileId: profile.profileId,
      ...formFlagBindings(),
      disableAddAnotherSkillNba: true,
      isFromDetailScreen: isEdit,
      totalSkills: profile.totalSkills,
    };
  }

  async function saveSkill({ profile, skill, positionIds, isEdit }) {
    const keys = formKeys(crypto.randomUUID());
    const screenId = isEdit
      ? "com.linkedin.sdui.flagshipnav.profile.ProfileSkillDetailsEditForm"
      : "com.linkedin.sdui.flagshipnav.profile.ProfileSkillAddForm";
    const body = serverRequestBody(SAVE_ID, savePayload(keys, profile, isEdit), saveStates(keys, skill, positionIds), screenId);
    const root = rootRecord(await post(SAVE_ID, body));
    const errors = root?.response?.errors ?? ["unreadable response"];
    if (errors.length) throw new Error(JSON.stringify(errors).slice(0, 300));
  }

  return { searchSkills, saveSkill };
})();
