import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'
import ripple from '@primeuix/themes/aura/ripple'
import tooltip from '@primeuix/themes/aura/tooltip'
import './styleoverrides.scss'
import './forms.scss'
import colors from './colors.module.scss'

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
         50:  colors.brandBlue300,
         100: colors.brandBlue300,
         200: colors.brandBlue300,
         300: colors.brandBlue300,
         400: colors.brandBlue100,
         500: colors.brandBlue100,
         600: colors.brandBlue100,
         700: colors.brandBlue100,
         800: colors.brandBlue,
         900: colors.brandBlue,
         950: colors.brandBlue
      },
      focusRing: {
         width: '2px',
         style: 'dotted',
         offset: '3px'
      },
      formField: {
         paddingX: '0.75rem',
         paddingY: '0.5rem',
         borderRadius: '0.3rem',
         focusRing: {
             width: '1px',
             style: 'dashed',
             color: '{primary.color}',
             offset: '3px',
             shadow: 'none'
         },
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
               color: colors.textDark,
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
            borderColor: colors.grey200,
            hoverBackground: colors.grey200,
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
            gap: '0.5rem',
            borderRadius: '.3rem',
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
               root: {
                  primary: {
                     hoverBackground: colors.brandBlue200,
                  },
                  secondary: {
                     background: colors.grey200,
                     hoverBackground: colors.grey100,
                     hoverBorderColor: colors.grey,
                     borderColor: colors.grey100,
                     activeBackground: colors.grey100,
                     color: colors.textDark,
                     focusRing: {
                        color: colors.brandBlue100,
                     },
                  },
                  contrast: {
                     background: colors.brandOrangeDark,
                     hoverBackground: colors.brandOrange,
                     activeBackground: colors.brandOrange,
                     focusRing: {
                        color: 'white',
                        shadow: 'none'
                     }
                  },
                  info: {
                     background: colors.blueAlt300,
                     activeBackground: colors.blueAlt300,
                     activeColor: '#000000',
                     hoverBackground: '#91d8f2',
                     hoverBorderColor: '#007BAC',
                     borderColor: '#007BAC',
                     color: '#000000',
                     hoverColor: '#000000',
                     borderWidth: '2px'
                  },
               },
               text: {
                  primary: {
                     hoverBackground: colors.grey200,
                     activeBackground: colors.grey200,
                     color: colors.textDark,
                  },
               },
               link: {
                  color: colors.blueAltDark,
                  hoverColor: colors.blueAlt,
                  activeColor: colors.blueAltDark,
               },
               outlined: {
                  secondary: {
                      hoverBackground:colors.grey200,
                      borderColor: colors.grey100,
                      color: colors.textDark,

                  },
               }
            }
         }
      },
      datatable: {
         paginatorTop: {
            borderColor: 'transparent',
            borderWidth: '0 0 0 0'
        },
        paginatorBottom: {
            borderColor: colors.grey100,
            borderWidth: '1px 0 0 0'
        },
         headerCell: {
            borderColor: 'transparent',
         },
         bodyCell: {
            borderColor: 'transparent',
        }
      },
      dialog: {
         root: {
            background: '#ffffff',
            borderColor: colors.grey,
            borderRadius: '0.3rem',
         },
         header: {
            padding: '5px 10px',
         },
         content: {
            padding: '1.5rem'
         },
         title: {
            fontWeight: '600',
            fontSize: '1em',
         },
         footer: {
            gap: '1rem'
         }
      },
      menubar: {
         root: {
            borderRadius: "0px",
            background: colors.blueAltDarkest,
            borderColor: colors.blueAltDarkest,
         },
         baseItem: {
            borderRadius: '0.3rem',
         },
         item: {
            focusBackground: colors.blueAlt,
            activeBackground: colors.blueAlt,
            color: '#ffffff',
            focusColor: '#ffffff',
            activeColor: '#ffffff',
            icon: {
               color: '#ffffff',
               focusColor: '#ffffff',
               activeColor: '#ffffff',
           }
         },
         submenu: {
            background: colors.blueAltDark,
            borderColor: colors.blueAltDark,
            borderRadius: '0.3rem',
            shadow: '{overlay.navigation.shadow}',
            mobileIndent: '1rem',
        },
        submenuIcon: {
            size: '{navigation.submenu.icon.size}',
            color: '#ffffff',
            focusColor: '#ffffff',
            activeColor: '#ffffff',
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
            borderColor:  colors.grey100,
            borderRadius: '0.3rem 0.3rem 0 0',
            padding: '1rem'
         },
         title: {
            fontWeight: '600',
         },
      },
      popover: {
         root: {
            borderColor: colors.grey100,
            color: colors.textDark,
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
            selectedFocusBackground: colors.blueAlt300,
            selectedFocusColor: colors.textDark,
            selectedBackground: colors.blueAlt300,
            selectedColor: colors.textDark
         }
      },
      tabs: {
         tab: {
            background: '#ffffff',
            hoverBackground: '{surface.100}',
            activeBackground: colors.brandBlue,
            borderWidth: '1px 1px 1px 1px',
            activeColor: '#ffffff',
            activeBorderColor: colors.brandBlue,
         },
         tabpanel: {
            background: '#ffffff',
            color: colors.textDark,
            padding: '0 0 0 0',
         },
         activeBar: {
            height: '1px',
            bottom: '-1px',
            background: colors.grey100
        },
      },
      togglebutton: {
         colorScheme: {
            light: {
               root: {
                  background: '#ffffff',
                  checkedBackground: colors.blueAlt300,
                  hoverBackground: '{surface.100}',
                  borderColor: colors.grey100,
                  color: colors.textDark,
                  checkedColor: colors.textDark,
                  checkedBorderColor: colors.blueAlt300,
               },
            }
         }
      },
      toast: {
         root: {
            borderWidth: '1px'
         },
         content: {
            gap: '1rem'
         },
         text: {
            gap: '0.5rem'
         },
         summary: {
            fontWeight: '400',
            fontSize: '1.15rem'
         },
         icon: {
            size: '2rem'
         },
         colorScheme: {
            light: {
               success: {
                  background: colors.green200,
                  borderColor: colors.green,
                  color: colors.textDark
               }
            }
         }
      }
   },
   directives: {
      tooltip,
      ripple
   }
});

export default UVA;