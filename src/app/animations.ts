import {animate, query, stagger, state, style, transition, trigger} from "@angular/animations";

export const flowInChild = trigger("flowInChild", [
    transition('* => *', [
        query(':enter', [
                style({opacity: 0, transform: "translateY(-1.5rem)"}),
                stagger(101,
                    animate(".4s", style({opacity: 1, transform: "translateY(0)"}))
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
