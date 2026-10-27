param([ValidateSet('kinetic','mockups')][string]$Model='kinetic')
Add-Type -AssemblyName System.Speech
$voice = New-Object System.Speech.Synthesis.SpeechSynthesizer
$french = $voice.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.Name -like 'fr-*' } | Select-Object -First 1
if (-not $french) { throw 'Aucune voix francaise locale disponible.' }
$voice.SelectVoice($french.VoiceInfo.Name)
$voice.Rate = 2
$segments = if ($Model -eq 'mockups') { @(
 "Votre idee prend forme a l'ecran.",
 'Une application web, pensee pour vos usages.',
 'Et sur mobile, un parcours adapte.',
 'Un produit. Plusieurs ecrans.',
 'B et M. Du besoin au produit.'
) } else { @(
 'Vos informations sont partout.',
 'Votre temps est precieux.',
 'Posez votre question.',
 'Retrouvez les sources. Verifiez.',
 "L'intelligence artificielle prepare. Vous decidez.",
 'B et M. Parlons de votre projet.'
) }
$subdir = if ($Model -eq 'mockups') { '.hyperframes\voice-mockups' } else { '.hyperframes\voice' }
$target = Join-Path $PSScriptRoot $subdir
New-Item -ItemType Directory -Force -Path $target | Out-Null
for ($index = 0; $index -lt $segments.Count; $index++) {
 $voice.SetOutputToWaveFile((Join-Path $target ('phrase-' + $index + '.wav')))
 $voice.Speak($segments[$index])
 $voice.SetOutputToNull()
}
$voice.Dispose()
Write-Output 'Six phrases creees avec la voix francaise installee sur Windows. Aucun appel API.'
