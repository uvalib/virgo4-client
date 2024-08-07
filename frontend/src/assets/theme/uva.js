import { definePreset } from '@primevue/themes'
import Aura from '@primevue/themes/aura'
import ripple from '@primevue/themes/aura/ripple'
import tooltip from '@primevue/themes/aura/tooltip'
import './uva-colors.css'
import './styleoverrides.scss'

const UVA = definePreset(Aura, {
   root: {
      borderRadius: {
         none: '0',
         xs: '2px',
         sm: '3px',
         md: '4px',
         lg: '4px',
         xl: '8px'
      },
   },
   semantic: {
      primary: {
         50: 'var(--uvalib-brand-blue-lightest)',
         100: 'var(--uvalib-brand-blue-lighter)',
         200: 'var(--uvalib-brand-blue-lighter)',
         300: 'var(--uvalib-brand-blue-lighter)',
         400: 'var(--uvalib-brand-blue-light)',
         500: 'var(--uvalib-brand-blue-light)',
         600: 'var(--uvalib-brand-blue-light)',
         700: 'var(--uvalib-brand-blue-light)',
         800: 'var(--uvalib-brand-blue)',
         900: 'var(--uvalib-brand-blue)',
         950: 'var(--uvalib-brand-blue)'
      },
      focusRing: {
         width: '2px',
         style: 'dotted',
         offset: '3px'
      },
      formField: {
         paddingX: '0.75rem',
         paddingY: '0.5rem',
         borderRadius: '4px',
         focusRing: {
             width: '1px',
             style: 'dashed',
             color: '{primary.color}',
             offset: '3px',
             shadow: 'none'
         },
         transitionDuration: '{transition.duration}'
      },
      disabledOpacity: '0.3',
      colorScheme: {
         light: {
            primary: {
               color: '{primary.500}',
               contrastColor: '#ffffff',
               hoverColor: '{primary.100}',
               activeColor: '{primary.500}'
            },
            highlight: {
               background: '#ffffff',
               focusBackground: '#ffffff',
               color: 'var(--uvalib-text)',
               focusColor: '#ffffff'
            }
         },
      }
   },
   components: {
      accordion: {
         header: {
            background: '#f8f9fa',
            hoverBackground: '#f5f5ff',
            activeBackground: '#f8f9fa',
            activeHoverBackground: '#f8f9fa',
            borderRadius: 0,
         },
         panel: {
            borderWidth: '1px',
            borderColor: 'var(--uvalib-grey-lightest)',
            hoverBackground: 'var(--uvalib-grey-lightest)',
        },
        content: {
            background: '#ffffff',
            borderWidth: '1px 0 0 0',
            padding: '1.125rem 1.125rem 1.125rem 1.125rem'
        }
      },
      button: {
         root: {
            paddingY: '.5em',
            paddingX: '1em',
            sm: {
               fontSize: '0.875rem',
               paddingX: '0.625rem',
               paddingY: '0.375rem'
           },
           lg: {
               fontSize: '1.5rem',
               paddingX: '1.2rem',
               paddingY: '0.6rem'
           },
         },
         colorScheme: {
            light: {
               secondary: {
                  background: 'var(--uvalib-grey-lightest)',
                  hoverBackground: 'var(--uvalib-grey-light)',
                  hoverBorderColor: 'var(--uvalib-grey)',
                  borderColor: 'var(--uvalib-grey-light)',
                  color: 'var(--uvalib-text)',
               },
               contrast: {
                  background: 'var(--uvalib-brand-orange)',
                  hoverBackground: 'var(--uvalib-brand-orange-dark)',
                  activeBackground: 'var(--uvalib-brand-orange)',
                  focusRing: {
                     color: 'white',
                     shadow: 'none'
                  }
               },
               info: {
                  background: '#BFE7F7',
                  hoverBackground: '#91d8f2',
                  hoverBorderColor: '#007BAC',
                  borderColor: '#007BAC',
                  color: '#000000',
                  hoverColor: '#000000',
                  borderWidth: '2px'
               },
               text: {
                  primary: {
                     hoverBackground: 'var(--uvalib-grey-lightest)',
                     activeBackground: 'var(--uvalib-grey-lightest)',
                     color: 'var(--uvalib-text)'
                 },
               },
               link: {
                  color: `var(--color-link)`,
               }
            }
         }
      },
      datatable: {
         paginatorTop: {
            borderColor: 'var(--uvalib-grey-lightest)',
         },
         headerCell: {
            borderColor: 'var(--uvalib-grey-lightest)',
         },
         bodyCell: {
            borderColor: 'var(--uvalib-grey-lightest)',
        },
         colorScheme: {
            light: {
               root: {
                  borderColor: 'transparent'
              },
            }
         }
      },
      dialog: {
         colorScheme: {
            light: {
               root: {
                  background: '#ffffff',
                  borderColor: 'var(--uvalib-grey)',
                  padding: '15px 15px',
                  borderRadius: '4px',
               },
               header: {
                  padding: '5px 10px',
               },
               title: {
                  fontWeight: '600',
                  fontSize: '1em',
               }
            }
         }
      },
      menubar: {
         root: {
            borderRadius: "0px",
         },
         item: {
            focusBackground: 'var(--uvalib-grey-lightest)',
            activeBackground: 'var(--uvalib-grey-lightest)',
         },
      },
      panelmenu: {
         panel: {
            padding: '0 0',
            background: '#ffffff',
         },
         item: {
            color: 'red'
         },
         submenu: {
            indent: '0',
        },
      },
      panel: {
         header: {
            background: '#f8f9fa',
            borderColor:  'var(--uvalib-grey-light)',
            borderRadius: '4px 4px 0 0',
            padding: '1rem'
         },
         title: {
            fontWeight: '600',
         },
      },
      popover: {
         root: {
            borderColor: 'var(--uvalib-grey-light)',
            color: 'var(--uvalib-text)',
         },
         content: {
            padding: '0',
        }
      },
      select: {
         root: {
            paddingY: '.5em',
            paddingX: '.5em',
            disabledBackground: '#fafafa',
            disabledColor: '#cacaca',
         },
         option: {
            selectedFocusBackground: 'var(--uvalib-blue-alt-light)',
            selectedFocusColor: 'var(--uvalib-text)',
            selectedBackground: 'var(--uvalib-blue-alt-light)',
            selectedColor: 'var(--uvalib-text)'
         }
      },
      tabs: {
         tab: {
            background: '#ffffff',
            hoverBackground: '{surface.100}',
            activeBackground: 'var(--uvalib-brand-blue)',
            borderWidth: '1px 1px 1px 1px',
            activeColor: '#ffffff',
            activeBorderColor: 'var(--uvalib-brand-blue)',
         },
         tabpanel: {
            background: '#ffffff',
            color: 'var(--uvalib-text)',
            padding: '0 0 0 0',
         },
         activeBar: {
            height: '1px',
            bottom: '-1px',
            background: 'var(--uvalib-grey-light)'
        },
      },
      togglebutton: {
         colorScheme: {
            light: {
               root: {
                  background: '#ffffff',
                  checkedBackground: 'var(--uvalib-blue-alt-light)',
                  hoverBackground: '{surface.100}',
                  borderColor: 'var(--uvalib-grey-light)',
                  color: 'var(--uvalib-text)',
                  checkedColor: 'var(--uvalib-text)',
                  checkedBorderColor: 'var(--uvalib-blue-alt-light)',
               },
            }
         }
      },
   },
   directives: {
      tooltip,
      ripple
   }
});

export default UVA;