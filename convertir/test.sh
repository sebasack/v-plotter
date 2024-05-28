#!/bin/bash

# Parse command line options
print_help() {
    echo "foo bar"
    exit
}

if options="$(getopt -o hw:p:nc -l help,width:,padding: -- "$@")"; then
    eval set -- "$options"
    while true
    do
        case "${1,,}" in
            -h|--help) # Display help
                print_help
                break
                ;;
            -w|--width) # Set width
                if [[ $2 =~ ^[0-9]+$ ]]; then
                    width="$2"
                    shift
                else
                    echo "Error: Invalid width argument: $2"
                    print_help
                fi
                ;;
            -p|--padding) # Set padding
                if [[ $2 =~ ^[0-9]+$ ]]; then
                    padding="$2"
                    shift
                else
                    echo "Error: Invalid padding argument: $2"
                    print_help
                fi
                ;;
            -n) # Display without border
                only_text=true
                ;;
            -c) # Use special character
                special_chars=true
                ;;
            --)
                shift
                break
                ;;
            *)
                echo -e "Invalid option '$1'\n"
                print_help
                ;;
        esac
        shift
    done
else
    echo
    print_help
fi

echo "width: $width"                    # debug
echo "padding: $padding"                # debug
echo "no border: $only_text"            # debug
echo "special_chars: $special_chars"    # debug