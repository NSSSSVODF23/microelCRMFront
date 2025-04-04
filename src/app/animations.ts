import {animate, query, stagger, state, style, transition, trigger} from "@angular/animations";

export const flowInChild = trigger("flowInChild", [
    transition('* => *', [
        query(':enter', [
                style({opacity: 0, transform: "translateY(-2rem)"}),
                stagger(30,
                    animate(".3s", style({opacity: 1, transform: "translateY(0)"}))
                )
            ],
            {
                optional: true
            }
        )
    ])
])

export const flow = trigger("flow", [
    transition(':enter', [
        style({opacity: 0.6, transform: "translateY(.6rem)"}),
        animate('0.2s',
            style({opacity: 1, transform: "translateY(0)"}))  // final
    ]),
    transition(':leave', [
        style({opacity: 1, transform: "translateY(0)"}),  // initial
        animate('0.2s',
            style({opacity: 0, transform: "translateY(.6rem)"}))  // final
    ])
])

export const flowLeft = trigger("flowLeft", [
    transition(':enter', [
        style({opacity: 0, transform: "translateX(10rem)"}),
        animate('0.2s',
            style({opacity: 1, transform: "translateX(0)"}))  // final
    ]),
    transition(':leave', [
        style({opacity: 1, transform: "translateX(0)"}),  // initial
        animate('0.2s',
            style({opacity: 0, transform: "translateX(10rem)", height: 0}))  // final
    ])
])

export const fade = trigger("fade", [
    transition(':enter', [
        style({opacity: 0}),  // initial
        animate('0.2s',
            style({opacity: 1}))  // final
    ]),
    transition(':leave', [
        style({opacity: 1}),  // initial
        animate('0.2s',
            style({opacity: 0}))  // final
    ])
])

export const fadeIn = trigger("fadeIn", [
    transition(':enter', [
        style({opacity: 0}),  // initial
        animate('0.2s',
            style({opacity: 1}))  // final
    ]),
])

export const fadeAlt = trigger("fadeAlt", [
    state('fade', style({opacity: 0})),
    state('unfade', style({opacity: .2})),
    transition('* => unfade', [
        animate('0.2s')  // final
    ]),
    transition('* => fade', [
        animate('0.2s')  // final
    ])
])

export const fadeFullAlt = trigger("fadeFullAlt", [
    state('fade', style({opacity: 0})),
    state('unfade', style({opacity: 1})),
    transition('* => unfade', [
        animate('0.2s')  // final
    ]),
    transition('* => fade', [
        animate('0.2s')  // final
    ])
])

export const swipeChild = trigger('swipeChild', [
    transition('* => *', [
        query(':enter', [
            style({
                opacity: 0,
                transform: 'translateX(-2rem)',
            }),
            stagger(85, [
                animate(
                    '250ms',
                    style({ opacity: 1, transform: 'none' })
                ),
            ]),
        ],{optional: true}),
    ]),
])

export const swipe =trigger('swipe', [
    state(
        'default',
        style({
            opacity: 1,
            transform: 'translateX(0)',
        })
    ),
    state(
        'right',
        style({
            opacity: 0,
            transform: 'translateX(10%) scale(0.9)',
            transformOrigin: 'center right',
        })
    ),
    state(
        'left',
        style({
            opacity: 0,
            transform: 'translateX(-10%) scale(0.9)',
            transformOrigin: 'center left',
        })
    ),
    transition('default <=> right', animate('200ms ease-out')),
    transition('default <=> left', animate('200ms ease-out')),
    transition('right <=> left', animate('0s')),
])

// Fast fade in and slow fade out
export const fadeFast = trigger("fadeFast", [
    transition(':enter', [
        style({opacity: 0}),  // initial
        animate('0.15s',
            style({opacity: 1}))  // final
    ]),
    transition(':leave', [
        style({opacity: 1}),  // initial
        animate('5s',
            style({opacity: 0}))  // final
    ])
]);
