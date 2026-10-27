# Local Windows voice only. No model, API, subscription or reference audio.
param([string]$Voice = 'Microsoft Hortense Desktop')
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$motionRoot = Split-Path $PSScriptRoot -Parent
$motionOut = Join-Path $motionRoot 'output/social/mockups-v2/audio'
New-Item -ItemType Directory -Force -Path $motionOut | Out-Null
$motionFfmpeg = Join-Path $motionRoot '.local/motion-bin/ffmpeg.exe'
$motionFfprobe = Join-Path $motionRoot '.local/motion-bin/ffprobe.exe'
$motionCues = @(
    @{At=0.1; End=2.15; Text='Vos outils sont dispersés ?'},
    @{At=2.3; End=4.1; Text='Tout, au même endroit.'},
    @{At=4.35; End=7.7; Text='Une demande, créée en quelques clics.'},
    @{At=8.05; End=10.25; Text='Votre équipe la retrouve sur mobile.'},
    @{At=10.5; End=12.25; Text='Moins de flou. Plus de suivi.'},
    @{At=12.55; End=14.85; Text='B et M. Votre métier, votre outil.'}
)
$motionArgs = @('-hide_banner','-loglevel','error','-y')
$motionFilters = @()
for ($motionIndex=0; $motionIndex -lt $motionCues.Count; $motionIndex++) {
    $motionCue=$motionCues[$motionIndex]
    $motionFile=Join-Path $motionOut "phrase-$motionIndex.wav"
    $motionSynth=New-Object System.Speech.Synthesis.SpeechSynthesizer
    try {
        $motionSynth.SelectVoice($Voice)
        $motionSynth.Rate=1
        $motionSynth.SetOutputToWaveFile($motionFile)
        $motionSynth.Speak($motionCue.Text)
    } finally { $motionSynth.Dispose() }
    $motionDuration=[double](& $motionFfprobe -v error -show_entries format=duration -of default=nw=1:nk=1 $motionFile)
    $motionTempo=[Math]::Max(1,$motionDuration/($motionCue.End-$motionCue.At))
    $motionTempoText=$motionTempo.ToString('0.0000',[Globalization.CultureInfo]::InvariantCulture)
    $motionDelay=[int]($motionCue.At*1000)
    $motionArgs+=@('-i',$motionFile)
    $motionFilters+="[${motionIndex}:a]atempo=$motionTempoText,adelay=${motionDelay}:all=1[v$motionIndex]"
}
$motionInputs=(0..($motionCues.Count-1)|ForEach-Object {"[v$_]"}) -join ''
$motionFilters+="${motionInputs}amix=inputs=$($motionCues.Count):normalize=0,alimiter=limit=0.85,apad,atrim=duration=15[out]"
$motionArgs+=@('-filter_complex',($motionFilters -join ';'),'-map','[out]','-ar','48000','-ac','1','-c:a','pcm_s16le',(Join-Path $motionRoot 'studio-social/assets/mockups-voice.wav'))
& $motionFfmpeg @motionArgs
if ($LASTEXITCODE -ne 0) { throw 'La préparation de la narration a échoué.' }
Write-Output 'Narration locale : six phrases alignées, durée 15 secondes.'
