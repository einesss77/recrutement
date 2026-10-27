const deliverySteps=[
 ['Cadrage',['Usages et objectifs','Périmètre et priorités','Contraintes et intégrations']],
 ['Conception',['Parcours utilisateurs','Maquettes et prototype','Choix techniques']],
 ['Itérations',['Fonctionnalités prioritaires','Démonstrations & retours','Ajustements du produit']],
 ['Tests & validation',['Tests fonctionnels','Retours de vos équipes','Corrections et recette']],
 ['Mise en service',['Préparation du déploiement','Documentation utile','Transmission des accès']],
 ['Suite & évolutions',['Reprise par vos équipes','Maintenance à définir','Évolutions à prioriser']],
];

export function deliveryMethod({eyebrow,button,arrowLink,icon}){return `<section class="delivery-method" id="solutions-concretes"><div class="wrap" id="methode-projet"><header class="delivery-heading" data-reveal><div>${eyebrow('NOTRE MÉTHODE · APPROCHE AGILE')}<h2>Confiez-nous votre projet.<br>On le développe.</h2></div><p>Nous cadrons une première version utile, puis avançons par itérations : démonstrations, retours et ajustements avec vos équipes.</p></header><ol class="delivery-grid" aria-label="Les six étapes de réalisation">${deliverySteps.map(([title,items],i)=>`<li class="delivery-step" data-reveal><span class="delivery-step-number">0${i+1}<span aria-hidden="true">↗</span></span><h3>${title}</h3><ul>${items.map(item=>`<li>${icon('check')}<span>${item}</span></li>`).join('')}</ul></li>`).join('')}</ol><footer class="delivery-footer"><div class="delivery-links">${button('Parlons de votre projet','/contact/?besoin=solution','dark')}${arrowLink('Notre méthode agile en détail','/notre-methode/')}</div><p>Périmètre, livrables et modalités de maintenance précisés dans la proposition.</p></footer></div></section>`}
