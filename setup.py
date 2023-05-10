from pathlib import Path

from setuptools import find_packages, setup

HERE = Path(__file__).parent
README = HERE.joinpath("README.md").read_text()
REQUIREMENTS = HERE.joinpath("requirements", "requirements.in").read_text().split()

setup(
    name="motifstudio",
    author="Jordan Matelsky",
    author_email="opensource@matelsky.com",
    description="",
    long_description=README,
    long_description_content_type="text/markdown",
    packages=find_packages("src"),
    package_dir={"": "src"},
    install_requires=REQUIREMENTS,
    python_requires=">=3.9.0",
)
