use std::path::PathBuf;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ComputeTarget {
    WebWasm,
    DesktopNative,
    HeadlessCli,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SimulationMode {
    Fast2State,
    Accurate4State,
    Formal,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ComputeOperation {
    Lint,
    Run,
    Prove,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ProjectManifest {
    pub project_name: String,
    pub top_module: String,
    pub rtl_files: Vec<PathBuf>,
    pub include_dirs: Vec<PathBuf>,
    pub sim_mode: SimulationMode,
    pub testbench: Option<PathBuf>,
    pub waveform_signals: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ComputeRequest {
    pub operation: ComputeOperation,
    pub manifest: ProjectManifest,
    pub workspace_root: Option<PathBuf>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DiagnosticSeverity {
    Error,
    Warning,
    Info,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Diagnostic {
    pub severity: DiagnosticSeverity,
    pub message: String,
    pub file: Option<PathBuf>,
    pub line: Option<u32>,
    pub column: Option<u32>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WaveformArtifact {
    pub path: PathBuf,
    pub format: WaveformFormat,
    pub duration_fs: Option<u64>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WaveformFormat {
    Vcd,
    Fst,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ComputeResult {
    pub ok: bool,
    pub target: ComputeTarget,
    pub operation: ComputeOperation,
    pub diagnostics: Vec<Diagnostic>,
    pub waveform: Option<WaveformArtifact>,
    pub counterexample: Option<WaveformArtifact>,
}

pub trait IComputeEngine {
    fn target(&self) -> ComputeTarget;
    fn supported_modes(&self) -> &[SimulationMode];
    fn execute(&self, request: &ComputeRequest) -> Result<ComputeResult, ComputeError>;
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ComputeError {
    InvalidManifest(String),
    UnsupportedMode(SimulationMode),
    ToolchainUnavailable(String),
    ExecutionFailed(String),
}

impl std::fmt::Display for ComputeError {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::InvalidManifest(message) => write!(formatter, "invalid manifest: {message}"),
            Self::UnsupportedMode(mode) => write!(formatter, "unsupported simulation mode: {mode:?}"),
            Self::ToolchainUnavailable(tool) => write!(formatter, "toolchain unavailable: {tool}"),
            Self::ExecutionFailed(message) => write!(formatter, "execution failed: {message}"),
        }
    }
}

impl std::error::Error for ComputeError {}
