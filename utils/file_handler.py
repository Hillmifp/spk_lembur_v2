from tkinter import filedialog, Tk


def choose_excel_file():

    root = Tk()
    root.withdraw()

    file_path = filedialog.askopenfilename(
        title="Pilih File Excel",
        filetypes=[("Excel Files", "*.xlsx *.xls")]
    )

    if not file_path:

        raise FileNotFoundError(
            "Tidak ada file dipilih."
        )

    return file_path