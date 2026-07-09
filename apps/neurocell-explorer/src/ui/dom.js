export function collectSceneElements() {
  return {
    sceneHost: document.querySelector("#scene"),
    labelsHost: document.querySelector("#labels"),
    modelLoading: document.querySelector("#modelLoading")
  };
}

export function collectControls() {
  return {
    cellType: document.querySelector("#cellType"),
    reconstructionSource: document.querySelector("#reconstructionSource"),
    provenancePanel: document.querySelector("#provenancePanel"),
    provenanceLink: document.querySelector("#provenanceLink"),
    provenanceId: document.querySelector("#provenanceId"),
    provenanceArchive: document.querySelector("#provenanceArchive"),
    provenanceSpecies: document.querySelector("#provenanceSpecies"),
    provenanceRegion: document.querySelector("#provenanceRegion"),
    provenanceDomain: document.querySelector("#provenanceDomain"),
    provenanceDoi: document.querySelector("#provenanceDoi"),
    provenanceStats: document.querySelector("#provenanceStats"),
    provenanceCaveat: document.querySelector("#provenanceCaveat"),
    atlasImagePanel: document.querySelector("#atlasImagePanel"),
    atlasFigure: document.querySelector("#atlasFigure"),
    atlasImage: document.querySelector("#atlasImage"),
    atlasCaption: document.querySelector("#atlasCaption"),
    toggleAtlasImage: document.querySelector("#toggleAtlasImage"),
    toggleSoma: document.querySelector("#toggleSoma"),
    toggleDendrites: document.querySelector("#toggleDendrites"),
    toggleSpines: document.querySelector("#toggleSpines"),
    toggleAxon: document.querySelector("#toggleAxon"),
    toggleActivity: document.querySelector("#toggleActivity"),
    toggleContext: document.querySelector("#toggleContext"),
    toggleLabels: document.querySelector("#toggleLabels"),
    lightingMode: document.querySelector("#lightingMode"),
    toggleTransparency: document.querySelector("#toggleTransparency"),
    microgliaStatePanel: document.querySelector("#microgliaStatePanel"),
    microgliaSurveillance: document.querySelector("#microgliaSurveillance"),
    microgliaActivated: document.querySelector("#microgliaActivated"),
    microgliaDark: document.querySelector("#microgliaDark"),
    microgliaStateNote: document.querySelector("#microgliaStateNote"),
    pyramidalDetailPanel: document.querySelector("#pyramidalDetailPanel"),
    interneuronDetailPanel: document.querySelector("#interneuronDetailPanel"),
    purkinjeDetailPanel: document.querySelector("#purkinjeDetailPanel"),
    functionPanel: document.querySelector("#functionPanel"),
    functionTitle: document.querySelector("#functionTitle"),
    potentialBar: document.querySelector("#potentialBar"),
    potentialValue: document.querySelector("#potentialValue"),
    potentialThreshold: document.querySelector("#potentialThreshold"),
    activityStatus: document.querySelector("#activityStatus"),
    exciteNeuron: document.querySelector("#exciteNeuron"),
    inhibitNeuron: document.querySelector("#inhibitNeuron"),
    branchComplexity: document.querySelector("#branchComplexity"),
    spineDensity: document.querySelector("#spineDensity"),
    resetView: document.querySelector("#resetView"),
    addDendrite: document.querySelector("#addDendrite"),
    removeDendrite: document.querySelector("#removeDendrite"),
    studentMode: document.querySelector("#studentMode"),
    teacherMode: document.querySelector("#teacherMode"),
    branchLayerLabel: document.querySelector("#branchLayerLabel"),
    spineLayerLabel: document.querySelector("#spineLayerLabel"),
    axonLayerLabel: document.querySelector("#axonLayerLabel"),
    branchComplexityLabel: document.querySelector("#branchComplexityLabel"),
    spineDensityLabel: document.querySelector("#spineDensityLabel")
  };
}

export function applyLearningMode(mode, controls) {
  controls.studentMode.classList.toggle("is-active", mode === "student");
  controls.teacherMode.classList.toggle("is-active", mode === "teacher");

  document.querySelectorAll(".teacher-only").forEach((element) => {
    element.hidden = mode !== "teacher";
  });
  document.querySelectorAll(".student-only").forEach((element) => {
    element.hidden = mode !== "student";
  });
}
