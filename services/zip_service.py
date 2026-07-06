import zipfile
import os


def create_zip(
    file_paths,
    zip_path
):

    with zipfile.ZipFile(
        zip_path,
        "w",
        zipfile.ZIP_DEFLATED
    ) as zipf:

        for file_path in file_paths:

            if os.path.exists(file_path):

                zipf.write(
                    file_path,
                    arcname=os.path.basename(
                        file_path
                    )
                )

    return zip_path