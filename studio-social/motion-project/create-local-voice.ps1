Add-Type -AssemblyName System.Speech
$voice = New-Object System.Speech.Synthesis.SpeechSynthesizer
$french = $voice.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.Name -like 'fr-*' } | Select-Object -First 1
if (-not $french) { throw 'Aucune voix francaise locale disponible.' }
$voice.SelectVoice($french.VoiceInfo.Name)
$voice.Rate = 2
$segments = @(
 'Vos informations sont partout.',
 'Votre temps est precieux.',
 'Posez votre question.',
 'Retrouvez les sources. Verifiez.',
 "L'intelligence artificielle prepare. Vous decidez.",
 'B et M. Parlons de votre projet.'
)
$target = Join-Path $PSScriptRoot '.hyperframes\voice'
New-Item -ItemType Directory -Force -Path $target | Out-Null
for ($index = 0; $index -lt $segments.Count; $index++) {
 $voice.SetOutputToWaveFile((Join-Path $target ('phrase-' + $index + '.wav')))
 $voice.Speak($segments[$index])
 $voice.SetOutputToNull()
}
$voice.Dispose()
Write-Output 'Six phrases creees avec la voix francaise installee sur Windows. Aucun appel API.'
